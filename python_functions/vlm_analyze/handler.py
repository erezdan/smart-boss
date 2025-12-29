from flask import jsonify
from typing import Dict, Any, Optional
import time
import traceback
import os

from .openai_client import run_llm, run_vlm
from google.cloud import firestore

def is_cloud_runtime() -> bool:
    return os.environ.get("K_SERVICE") is not None

# -----------------------------
# Firestore
# -----------------------------

_db = None

def get_firestore():
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db

# -----------------------------
# CORS
# -----------------------------

ALLOWED_ORIGINS = {
    "https://smartboss.app",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
}

def _apply_cors(req, resp):
    origin = req.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return resp


# -----------------------------
# Errors
# -----------------------------

class ValidationError(Exception):
    pass


class ExecutionError(Exception):
    def __init__(
        self,
        message: str,
        stage: str,
        original_exception: Optional[Exception] = None,
    ):
        super().__init__(message)
        self.stage = stage
        self.original_exception = original_exception


# -----------------------------
# Entry point
# -----------------------------

def handle_vlm_analyze(req):
    start_time = time.time()
    log_record: Dict[str, Any] = {
        "function": "vlm_analyze",
        "status": "unknown",
        "stage": None,
        "caller_origin": req.headers.get("Origin"),
        "caller_ip": req.remote_addr,
        "created_at": firestore.SERVER_TIMESTAMP,
    }

    try:
        # OPTIONS (CORS preflight)
        if req.method == "OPTIONS":
            resp = jsonify({})
            resp.status_code = 204
            return _apply_cors(req, resp)

        if req.method != "POST":
            raise ValidationError("method_not_allowed")

        data = _parse_request(req)
        _validate_request(data)

        result = _execute_model(data)

        log_record.update({
            "status": "success",
            "mode": data.get("mode"),
            "model": data.get("model"),
        })

        resp = _build_success_response(result)
        return _apply_cors(req, resp)

    except ValidationError as e:
        log_record.update({
            "status": "validation_error",
            "stage": "validation",
            "error_message": str(e),
        })
        resp = _build_error_response(str(e), 400)
        return _apply_cors(req, resp)

    except ExecutionError as e:
        log_record.update({
            "status": "execution_error",
            "stage": e.stage,
            "error_message": str(e),
            "exception_type": type(e.original_exception).__name__ if e.original_exception else None,
            "exception_trace": traceback.format_exc(),
        })
        resp = _build_error_response("execution_error", 500)
        return _apply_cors(req, resp)

    except Exception as e:
        log_record.update({
            "status": "unexpected_error",
            "stage": "unknown",
            "error_message": str(e),
            "exception_type": type(e).__name__,
            "exception_trace": traceback.format_exc(),
        })
        resp = _build_error_response("internal_error", 500)
        return _apply_cors(req, resp)

    finally:
        log_record["latency_ms"] = int((time.time() - start_time) * 1000)
        _write_log(log_record)


# -----------------------------
# Helpers
# -----------------------------

def _parse_request(req) -> Dict[str, Any]:
    data = req.get_json(silent=True)
    if not data:
        raise ValidationError("missing_json_body")
    return data


def _validate_request(data: Dict[str, Any]) -> None:
    for field in ("mode", "model", "prompt"):
        if field not in data:
            raise ValidationError(f"missing_field:{field}")

    if data["mode"] not in ("vlm", "llm"):
        raise ValidationError("invalid_mode")

    if data["mode"] == "vlm" and not data.get("image_base64"):
        raise ValidationError("missing_image_base64_for_vlm")


def _execute_model(data: Dict[str, Any]) -> Dict[str, Any]:
    mode = data["mode"]
    model = data["model"]
    prompt = data["prompt"]
    metadata = data.get("metadata")
    
    try:
        if mode == "llm":
            openai_response = run_llm(prompt=prompt, model=model)

        elif mode == "vlm":
            image_base64 = data["image_base64"]
            openai_response = run_vlm(
                prompt=prompt,
                image_base64=image_base64,
                model=model,
            )

        else:
            raise ValueError("unsupported_mode")

        return {
            "mode": mode,
            "model": model,
            "metadata": metadata,
            "openai_response": openai_response.model_dump(),
        }

    except Exception as e:
        raise ExecutionError(
            message="openai_execution_failed",
            stage="openai_call",
            original_exception=e,
        )


def _write_log(record: Dict[str, Any]) -> None:
    if not is_cloud_runtime():
        # Local dev: print to console instead
        print("[LOG]", record)
        return

    try:
        db = get_firestore()
        if db is not None:
            db.collection("logs").add(record)
    except Exception as e:
        # Never fail request because of logging
        print("[LOGGING ERROR]", str(e))


def _build_success_response(result: Dict[str, Any]):
    return jsonify({
        "status": "ok",
        "result": result,
    })


def _build_error_response(message: str, status_code: int):
    resp = jsonify({
        "status": "error",
        "message": message,
    })
    resp.status_code = status_code
    return resp
