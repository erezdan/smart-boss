import asyncio
import threading
from typing import List

import torch
from sentence_transformers import SentenceTransformer

from utils.logger import logger


# Model name (centralized)
_MODEL_NAME = "BAAI/bge-m3"

# Module-level singleton
_text_model: SentenceTransformer | None = None
_model_lock = threading.Lock()


def _load_text_model():
    """
    Load text embedding model once.
    Thread-safe and crash-safe.
    """
    global _text_model

    if _text_model is not None:
        return

    with _model_lock:
        if _text_model is not None:
            return

        try:
            logger.log(f"Loading text embedding model '{_MODEL_NAME}'")

            _text_model = SentenceTransformer(
                _MODEL_NAME,
                device="cpu",  # explicit for determinism
            )

            logger.log("Text embedding model loaded successfully")

        except Exception as e:
            logger.error("Failed to load text embedding model", exc_info=e)
            _text_model = None
            raise


def _embed_text_sync(text: str) -> List[float]:
    """
    Synchronous text embedding using BGE-M3.
    CPU-bound. Must never raise silently.
    """
    try:
        _load_text_model()

        if not text or not text.strip():
            raise ValueError("Empty text input")

        try:
            with torch.no_grad():
                embedding = _text_model.encode(
                    text,
                    normalize_embeddings=True,  # required for cosine similarity
                )
        except Exception as e:
            raise RuntimeError("Text model inference failed") from e

        if embedding is None or len(embedding) == 0:
            raise RuntimeError("Empty embedding generated")

        return embedding.tolist()

    except Exception as e:
        logger.error("Text embedding failed", exc_info=e)
        raise


async def embed_text(text: str) -> List[float]:
    """
    Async wrapper for text embedding.

    Safe to await.
    Offloads CPU-bound work to thread executor.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError as e:
        logger.error("embed_text called outside of an event loop", exc_info=e)
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
