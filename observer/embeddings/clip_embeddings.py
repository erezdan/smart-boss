import io
import asyncio
import threading
import time
import asyncio
from typing import List

from PIL import Image
import torch
from transformers import CLIPModel, CLIPProcessor

from utils.logger import logger


# Model name (centralized)
_MODEL_NAME = "openai/clip-vit-base-patch16"

# Module-level singletons
_clip_model: CLIPModel | None = None
_clip_processor: CLIPProcessor | None = None
_model_lock = threading.Lock()


def _load_clip():
    """
    Load CLIP model and processor once.
    Thread-safe and crash-safe.
    """
    global _clip_model, _clip_processor

    if _clip_model is not None and _clip_processor is not None:
        return

    with _model_lock:
        if _clip_model is not None and _clip_processor is not None:
            return

        try:
            logger.log(f"Loading CLIP model '{_MODEL_NAME}'")

            _clip_model = CLIPModel.from_pretrained(_MODEL_NAME)
            _clip_processor = CLIPProcessor.from_pretrained(
                _MODEL_NAME,
                use_fast=False,
            )

            _clip_model.eval()

            # Ensure model is on correct device (CPU by default)
            _clip_model.to("cpu")

            logger.log("CLIP model loaded successfully")

        except Exception as e:
            # Fatal: cannot embed images without a model
            logger.error("Failed to load CLIP model", exc_info=e)
            _clip_model = None
            _clip_processor = None
            raise


def embed_image_sync(image_buffer: bytes) -> List[float]:
    """
    Synchronous CLIP image embedding.
    CPU-bound. Must never raise silently.
    """
    try:
        start_ts = time.perf_counter()

        _load_clip()

        if not image_buffer:
            raise ValueError("Empty image buffer")

        try:
            image = Image.open(io.BytesIO(image_buffer)).convert("RGB")
        except Exception as e:
            raise ValueError("Invalid image buffer") from e

        try:
            inputs = _clip_processor(images=image, return_tensors="pt")
        except Exception as e:
            raise RuntimeError("CLIP processor failed") from e

        with torch.no_grad():
            try:
                features = _clip_model.get_image_features(**inputs)
            except Exception as e:
                raise RuntimeError("CLIP model inference failed") from e

        # L2 normalization (required for cosine similarity)
        try:
            features = features / features.norm(p=2, dim=-1, keepdim=True)
        except Exception as e:
            raise RuntimeError("Failed to normalize CLIP features") from e

        embedding = features[0].tolist()

        if not embedding:
            raise RuntimeError("Empty embedding generated")

        return embedding

    except Exception as e:
        # Log once per failure, never swallow silently
        logger.error("Image embedding failed", exc_info=e)
        raise

    finally:
        elapsed_ms = (time.perf_counter() - start_ts) * 1000
        print(f"CLIP embed_image time: {elapsed_ms:.2f} ms")

async def embed_image(image_buffer: bytes) -> List[float]:
    """
    Async wrapper for CLIP image embedding.

    Safe to await.
    Offloads CPU-bound work to thread executor.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError as e:
        logger.error("embed_image called outside of an event loop", exc_info=e)
        raise

    try:
        result = await loop.run_in_executor(
            None,
            embed_image_sync,
            image_buffer,
        )
        return result

    except Exception:
        # Error already logged in sync function
        raise


def _embed_text_sync(text: str) -> List[float]:
    """
    Synchronous CLIP text embedding.
    CPU-bound. Must never raise silently.
    """
    try:
        _load_clip()

        if not text or not text.strip():
            raise ValueError("Empty text input")

        try:
            inputs = _clip_processor(text=[text], return_tensors="pt", padding=True)
        except Exception as e:
            raise RuntimeError("CLIP processor failed for text") from e

        with torch.no_grad():
            try:
                features = _clip_model.get_text_features(**inputs)
            except Exception as e:
                raise RuntimeError("CLIP text inference failed") from e

        # L2 normalization (required for cosine similarity)
        try:
            features = features / features.norm(p=2, dim=-1, keepdim=True)
        except Exception as e:
            raise RuntimeError("Failed to normalize CLIP text features") from e

        embedding = features[0].tolist()

        if not embedding:
            raise RuntimeError("Empty text embedding generated")

        return embedding

    except Exception as e:
        logger.error("Text embedding failed", exc_info=e)
        raise


async def embed_clip_text(text: str) -> List[float]:
    """
    Async wrapper for CLIP text embedding.

    Safe to await.
    Offloads CPU-bound work to thread executor.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError as e:
        logger.error("embed_clip_text called outside of an event loop", exc_info=e)
        raise

    try:
        return await loop.run_in_executor(
            None,
            _embed_text_sync,
            text,
        )
    except Exception:
        # Error already logged in sync function
        raise
