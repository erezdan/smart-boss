from typing import List, Optional
from time import time

from qdrant_client.models import Distance

from utils.logger import logger
from vector_store.qdrant_client import QdrantClientWrapper


class ImageIndex:
    """
    Semantic index for image embeddings.
    Represents visual memory.
    """

    COLLECTION_NAME = "image_vectors"
    VECTOR_SIZE = 512  # CLIP ViT-B/16
    DISTANCE = Distance.COSINE

    def __init__(
        self,
        qdrant: QdrantClientWrapper,
        score_threshold: float = 0.85,
        top_k: int = 3,
    ):
        self._qdrant = qdrant
        self._score_threshold = score_threshold
        self._top_k = top_k

        # Ensure collection exists once
        self._qdrant.ensure_collection(
            collection_name=self.COLLECTION_NAME,
            vector_size=self.VECTOR_SIZE,
            distance=self.DISTANCE,
        )

    def search_similar(
        self,
        embedding: List[float],
        camera_id: Optional[str] = None,
    ):
        """
        Search for visually similar images.
        """
        try:
            hits = self._qdrant.search(
                collection_name=self.COLLECTION_NAME,
                vector=embedding,
                limit=self._top_k,
                score_threshold=self._score_threshold,
            )

            if camera_id:
                # Optional filtering by camera_id at payload level
                hits = [
                    h for h in hits
                    if h.payload and h.payload.get("camera_id") == camera_id
                ]

            return hits

        except Exception as e:
            logger.error("ImageIndex similarity search failed", exc_info=e)
            return []

    def add(
        self,
        embedding: List[float],
        camera_id: str,
        timestamp: Optional[float] = None,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Store a new image embedding in the index.
        """
        payload = {
            "camera_id": camera_id,
            "timestamp": timestamp or time(),
        }

        if metadata:
            payload.update(metadata)

        return self._qdrant.upsert(
            collection_name=self.COLLECTION_NAME,
            vector=embedding,
            payload=payload,
        )
