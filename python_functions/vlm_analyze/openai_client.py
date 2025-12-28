import os
from openai import OpenAI

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

def run_llm(prompt: str, model: str):
    client = get_openai_client()

    response = client.responses.create(
        model=model,
        input=prompt,
    )

    return response

def run_vlm(prompt: str, image_base64: str, model: str):
    client = get_openai_client()

    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {
                        "type": "input_image",
                        "image_base64": image_base64
                    }
                ]
            }
        ]
    )

    return response
