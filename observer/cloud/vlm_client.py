import base64
import re
from typing import Dict, Any, Optional

from cloud.cloud_client import CloudClient, CloudClientError


class VLMAnalysisError(Exception):
    pass


class VLMClient:
    def __init__(self, base_url: str):
        self._client = CloudClient(base_url)

    def analyze_image(
        self,
        image_url: str,
        static_prompt: str,
        dynamic_prompt: str,
        model: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Sends image to VLM Cloud Function.
        Returns raw openai_response dict.
        """
        try:
            if not image_url:
                raise VLMAnalysisError("empty_image_url")

            payload = {
                "mode": "vlm",
                "model": model,
                "static_prompt": static_prompt,
                "dynamic_prompt": dynamic_prompt,
                "image_url": image_url,
                "metadata": metadata or {},
            }

            resp = self._client.post_json(
                path="vlm_analyze",
                payload=payload,
            )

            openai_response = self._extract_openai_payload(resp)
            output_text = self._extract_output_text(openai_response)

            parsed = self._parse_model_sections(output_text)

            return {
                "frame_description": parsed["frame_description"],
                "rolling_context": parsed["rolling_context"],
                "raw": openai_response,
            }

        except CloudClientError as e:
            raise VLMAnalysisError("vlm_cloud_failed") from e

        except VLMAnalysisError:
            raise

        except Exception as e:
            raise VLMAnalysisError("vlm_unexpected_error") from e

    # -------- helpers --------

    @staticmethod
    def _extract_openai_payload(resp: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(resp, dict):
            raise VLMAnalysisError("invalid_response_type")

        result = resp.get("result")
        if not isinstance(result, dict):
            raise VLMAnalysisError("missing_result_section")

        openai_response = result.get("openai_response")
        if not isinstance(openai_response, dict):
            raise VLMAnalysisError("missing_openai_response")

        return openai_response

    @staticmethod
    def _extract_output_text(openai_response: Dict[str, Any]) -> str:
        for item in openai_response.get("output", []):
            if item.get("type") != "message":
                continue

            for block in item.get("content", []):
                if block.get("type") == "output_text":
                    text = block.get("text")
                    if isinstance(text, str) and text.strip():
                        return text

        raise VLMAnalysisError("no_output_text_found")

    @staticmethod
    def _parse_model_sections(text: str) -> Dict[str, str]:
        """
        Parse model output with mandatory sections:

        FRAME_DESCRIPTION:
        ...

        ROLLING_CONTEXT:
        ...
        """
        if not isinstance(text, str):
            raise VLMAnalysisError("model_output_not_text")

        rich_match = re.search(
            r"FRAME_DESCRIPTION:\s*(.+?)(?:\n\s*\n|ROLLING_CONTEXT:)",
            text,
            re.DOTALL | re.IGNORECASE,
        )

        clip_match = re.search(
            r"ROLLING_CONTEXT:\s*(.+)$",
            text,
            re.DOTALL | re.IGNORECASE,
        )

        if not rich_match:
            raise VLMAnalysisError("missing_frame_description")

        if not clip_match:
            raise VLMAnalysisError("missing_rolling_context")

        frame_desc = rich_match.group(1).strip()
        rolling_context = clip_match.group(1).strip()

        if not frame_desc:
            raise VLMAnalysisError("empty_frame_description")

        if not rolling_context:
            raise VLMAnalysisError("empty_rolling_context")

        return {
            "frame_description": frame_desc,
            "rolling_context": rolling_context,
        }
