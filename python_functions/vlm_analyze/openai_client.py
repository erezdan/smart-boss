import os
from openai import OpenAI
from typing import Optional, Dict, Any

_client = None


def get_openai_client() -> OpenAI:
    """
    Lazy singleton OpenAI client.
    Works in local (.env) and in Firebase (Secret Manager).
    """
    global _client

    if _client is None:
        api_key = os.environ.get("SMARTBOSS_OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("SMARTBOSS_OPENAI_API_KEY is missing")

        _client = OpenAI(
            api_key=api_key,
            timeout=30.0,   # seconds
            max_retries=2
        )

    return _client

def run_llm(
    static_prompt: str,
    dynamic_prompt: str,
    model: str,
):
    client = get_openai_client()

    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": static_prompt,
            },
            {
                "role": "user",
                "content": dynamic_prompt,
            },
        ],
    )

    return response


def run_vlm(
    *,
    static_prompt: str,
    dynamic_prompt: str,
    model: str,
    image_buffer: Optional[str] = None,
    image_url: Optional[str] = None,
):
    client = get_openai_client()

    if image_buffer is not None:
        image_input = {
            "type": "input_image",
            "image_url": f"data:image/jpeg;base64,{image_buffer}",
        }
    elif image_url is not None:
        image_input = {
            "type": "input_image",
            "image_url": image_url,
        }
    else:
        raise ValueError("missing_image_source")

    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": [
                    {
                        "type": "input_text",
                        "text": static_prompt,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": dynamic_prompt,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    image_input
                ],
            },
        ],
    )

    return response

