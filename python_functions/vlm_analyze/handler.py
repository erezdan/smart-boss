from flask import jsonify
from typing import Tuple, Dict, Any


def handle_vlm_analyze(req):
    """
    Entry point for VLM analysis.
    Works both in local Flask and Firebase Functions.
    """

    try:
        # 1. Parse request
        data = _parse_request(req)

        # 2. Validate request
        _validate_request(data)

        # 3. Process (stub for now)
        result = _process_vlm(data)

        # 4. Build response
        return _build_success_response(result)

    except ValidationError as e:
        return _build_error_response(str(e), status_code=400)

    except Exception as e:
        # TODO: add structured logging here
        return _build_error_response("internal error", status_code=500)


# -----------------------------
# Internal helpers
# -----------------------------

class ValidationError(Exception):
    pass


def _parse_request(req) -> Dict[str, Any]:
    """
    Extract JSON payload from request.
    """
    data = req.get_json(silent=True)
    if not data:
        raise ValidationError("missing JSON body")
    return data


def _validate_request(data: Dict[str, Any]) -> None:
    """
    Validate required fields.
    """
    required_fields = [
        "camera_id",
        "timestamp",
        "image_base64",
    ]

    for field in required_fields:
        if field not in data:
            raise ValidationError(f"missing field: {field}")


def _process_vlm(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Placeholder for VLM logic.
    Will be replaced with OpenAI / Vision model call.
    """

    # Extract fields
    camera_id = data["camera_id"]
    timestamp = data["timestamp"]

    # TODO:
    # - decode image
    # - call VLM
    # - generate clip_text
    # - generate semantic_text

    return {
        "camera_id": camera_id,
        "timestamp": timestamp,
        "clip_text": "stub clip text",
        "semantic_text": "stub semantic description",
    }


def _build_success_response(result: Dict[str, Any]):
    return jsonify({
        "status": "ok",
        "result": result
    })


def _build_error_response(message: str, status_code: int):
    return jsonify({
        "status": "error",
        "message": message
    }), status_code
