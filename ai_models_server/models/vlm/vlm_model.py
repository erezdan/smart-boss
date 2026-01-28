import os
import torch
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration


def _select_dtype() -> torch.dtype:
    if torch.cuda.is_available():
        return torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    return torch.float32


def _parse_dtype(value: str):
    if not value:
        return _select_dtype()

    normalized = value.lower()
    if normalized == "auto":
        return "auto"
    if normalized in ("bf16", "bfloat16"):
        return torch.bfloat16
    if normalized in ("fp16", "float16"):
        return torch.float16
    if normalized in ("fp32", "float32"):
        return torch.float32

    return _select_dtype()


def load_vlm_model():
    model_id = os.getenv("VLM_MODEL_ID", "Qwen/Qwen2.5-VL-7B-Instruct")
    device_map = os.getenv("VLM_DEVICE_MAP", "auto" if torch.cuda.is_available() else "")
    attn_impl = os.getenv("VLM_ATTN_IMPL", "")
    dtype = _parse_dtype(os.getenv("VLM_TORCH_DTYPE", "auto"))

    model_kwargs = {"torch_dtype": dtype}
    if device_map:
        model_kwargs["device_map"] = device_map
    if attn_impl:
        model_kwargs["attn_implementation"] = attn_impl

    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(model_id, **model_kwargs)
    processor = AutoProcessor.from_pretrained(model_id)

    return {"model": model, "processor": processor}
