import base64
from typing import Dict, Any, Optional

from cloud.cloud_client import CloudClient, CloudClientError


class VLMAnalysisError(Exception):
    pass


class VLMClient:
    def __init__(self, base_url: str):
        self._client = CloudClient(base_url)

    def analyze_image(
        self,
        image_buffer: bytes,
        prompt: str,
        model: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Sends image to VLM Cloud Function.
        Returns raw openai_response dict.
        """
        try:
            if not image_buffer:
                raise VLMAnalysisError("empty_image_buffer")

            image_base64 = base64.b64encode(image_buffer).decode("utf-8")

            payload = {
                "mode": "vlm",
                "model": model,
                "prompt": prompt,
                "image_base64": image_base64,
                "metadata": metadata or {},
            }

            resp = self._client.post_json(
                path="vlm_analyze",
                payload=payload,
            )
            print(resp)

            res = self._extract_openai_payload(resp)
            return res

        except CloudClientError as e:
            raise VLMAnalysisError("vlm_cloud_failed") from e

        except VLMAnalysisError:
            raise

        except Exception as e:
            raise VLMAnalysisError("vlm_unexpected_error") from e

    @staticmethod
    def extract_output_text(openai_response: dict) -> str:
        for item in openai_response.get("output", []):
            if item.get("type") == "message":
                for block in item.get("content", []):
                    if block.get("type") == "output_text":
                        return block.get("text")

        raise VLMAnalysisError("no_output_text_found")