import io
import asyncio
from PIL import Image
import torch
from transformers import CLIPModel, CLIPProcessor

# Load model and processor ONCE (module-level, important for performance)
_MODEL_NAME = "openai/clip-vit-base-patch16"

_clip_model: CLIPModel | None = None
_clip_processor: CLIPProcessor | None = None


def _load_clip():
    global _clip_model, _clip_processor

    if _clip_model is None or _clip_processor is None:
        _clip_model = CLIPModel.from_pretrained(_MODEL_NAME)
        _clip_processor = CLIPProcessor.from_pretrained(_MODEL_NAME)
        _clip_model.eval()


def _embed_image_sync(image_buffer: bytes) -> list[float]:
    """
    Synchronous CLIP image embedding.
    This function is CPU-bound and should NOT be called directly.
    """

    _load_clip()

    image = Image.open(io.BytesIO(image_buffer)).convert("RGB")

    inputs = _clip_processor(images=image, return_tensors="pt")

    with torch.no_grad():
        features = _clip_model.get_image_features(**inputs)

    # L2 normalization (critical for cosine similarity)
    features = features / features.norm(p=2, dim=-1, keepdim=True)

    return features[0].tolist()


async def embed_image(image_buffer: bytes) -> list[float]:
    """
    Async wrapper for CLIP image embedding.

    Can be awaited safely.
    Offloads CPU work to a thread executor.
    """

    loop = asyncio.get_running_loop()

    embedding = await loop.run_in_executor(
        None,
        _embed_image_sync,
        image_buffer
    )

    return embedding
