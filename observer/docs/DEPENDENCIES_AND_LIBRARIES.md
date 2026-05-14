# Dependencies and Libraries

This document summarizes major dependencies from `requirements.txt` and how they are used.

## Computer Vision

- `opencv-python`
  - Video capture.
  - Frame resizing.
  - JPEG encoding.
  - OpenCV-based crop refinement in experiments.

- `pillow`
  - Image decoding for CLIP.
  - Image conversion in anomaly injection and utility scripts.

- `numpy`
  - Frame/image array operations.

## Local ML Models

- `torch`
  - Runs CLIP and BGE-M3 inference.
  - Normalizes and merges tensors.

- `transformers`
  - Loads `openai/clip-vit-base-patch16`.
  - Provides `CLIPModel` and `CLIPProcessor`.

- `sentence-transformers`
  - Loads `BAAI/bge-m3`.
  - Generates semantic text embeddings.

- `torchvision`, `torchaudio`
  - Installed with the Torch stack, though not directly used by core code.

## Vector Store

- `qdrant-client`
  - Connects to local Qdrant.
  - Creates collections.
  - Upserts, queries, scrolls, and deletes vectors.

Qdrant dashboard note from `note.txt`:

```text
http://localhost:6333/dashboard
```

## Cloud and API

- `requests`
  - Used by `CloudClient` for VLM cloud function calls.

- `python-dotenv`
  - Loads `.env` in `main.py`.

- `firebase_admin`
  - Initializes Firebase Admin SDK.
  - Uploads/deletes temporary VLM images when enabled.

## UI

- `PySide6`
  - Development video player UI.

## Tokenization

- `tiktoken`
  - Used in `ImagePipeline.count_tokens()` for prompt diagnostics.

## Utilities and Transitive Libraries

The requirements file includes many transitive dependencies from Google Cloud, Hugging Face, Torch, Qdrant, and PySide6. They should be periodically regenerated only when dependency updates are intentional.

## Experimental or Missing Dependencies

Some experimental files import packages not listed in `requirements.txt`:

- `test/vlm_cropping.py` imports `openai`.
- `vlm/test.py` imports `ollama`.
- `utils/open_fiftyone.py` imports `fiftyone`.

These scripts may require additional local installs and should be treated as development experiments, not production runtime paths.
