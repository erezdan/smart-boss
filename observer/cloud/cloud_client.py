import requests
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class CloudClientError(Exception):
    pass


class CloudClient:
    def __init__(
        self,
        base_url: str,
        timeout_sec: int = settings.VLM_TIMEOUT_SEC,
    ):
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_sec

    def post_json(
        self,
        path: str,
        payload: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        url = f"{self._base_url}/{path.lstrip('/')}"
        try:
            resp = requests.post(
                url,
                json=payload,
                headers=headers or {},
                timeout=self._timeout,
            )

            data = resp.json()
            usage = (
                data
                .get("result", {})
                .get("openai_response", {})
                .get("usage")
            )
            if usage:
                #print(f"Usage: {usage}")

        except Exception as e:
            logger.error("Cloud request failed", exc_info=e)
            raise CloudClientError("cloud_request_failed") from e

        if resp.status_code >= 400:
            logger.error(
                "Cloud error response",
                extra={
                    "status": resp.status_code,
                    "body": resp.text,
                },
            )
            raise CloudClientError(
                f"cloud_http_{resp.status_code}"
            )

        try:
            return resp.json()
        except Exception as e:
            raise CloudClientError("invalid_json_response") from e
