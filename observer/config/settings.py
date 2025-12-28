import os


# ===============================
# Environment
# ===============================

ENV = os.getenv("ENV", "local")  # local / prod


# ===============================
# Cloud / VLM
# ===============================

# Base URL of the VLM Cloud Function
VLM_BASE_URL = os.getenv("VLM_BASE_URL")

if not VLM_BASE_URL:
    raise RuntimeError("VLM_BASE_URL is not set")


# Default VLM model
VLM_MODEL = os.getenv("VLM_MODEL")


# ===============================
# Timeouts / Retries
# ===============================

VLM_TIMEOUT_SEC = int(os.getenv("VLM_TIMEOUT_SEC", "30"))


# ===============================
# Embeddings
# ===============================

# CLIP text embedding model (local)
CLIP_TEXT_MODEL = os.getenv("CLIP_TEXT_MODEL")

# Semantic text embedding model (local or API)
TEXT_EMBEDDING_MODEL = os.getenv("TEXT_EMBEDDING_MODEL")


# ===============================
# Vector Store
# ===============================

VECTOR_STORE_NAMESPACE = os.getenv("VECTOR_STORE_NAMESPACE")
VECTOR_SIZE = os.getenv("VECTOR_SIZE")


# ===============================
# Logging
# ===============================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")