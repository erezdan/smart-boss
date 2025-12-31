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
    static_prompt: str,
    dynamic_prompt: str,
    image_url: str,
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
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_image",
                        "image_url": image_url,
                    }
                ],
            },
        ],
    )

    return response

