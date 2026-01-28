import threading

import torch

from models.registry import registry


_lock = threading.Lock()


def generate_vlm_text(prompt: str, image, max_new_tokens: int = 128) -> str:
    if registry.vlm_model is None:
        raise RuntimeError("VLM model is not loaded. Ensure startup loaded all models.")

    model = registry.vlm_model["model"]
    processor = registry.vlm_model["processor"]

    text, images, videos = _build_inputs(processor, prompt, image)
    inputs = processor(text=[text], images=images, videos=videos, return_tensors="pt")

    if hasattr(model, "device"):
        inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with _lock, torch.no_grad():
        output_ids = model.generate(**inputs, max_new_tokens=max_new_tokens)

    # Remove the prompt tokens and decode only the generated continuation.
    generated_ids = output_ids[:, inputs["input_ids"].shape[1]:]
    return processor.batch_decode(generated_ids, skip_special_tokens=True)[0]


def _build_inputs(processor, prompt: str, image):
    try:
        from qwen_vl_utils import process_vision_info

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": prompt},
                ],
            }
        ]
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        images, videos = process_vision_info(messages)
        return text, images, videos
    except Exception:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image"},
                    {"type": "text", "text": prompt},
                ],
            }
        ]
        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        return text, [image], None
