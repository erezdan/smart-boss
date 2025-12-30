from typing import List, Optional
from time import time

from qdrant_client.models import Distance

from utils.logger import logger
from vector_store.qdrant_wrapper import QdrantClientWrapper


class TextIndex:
    """
    Semantic index for text embeddings.

    Represents textual knowledge:
    - VLM outputs
    - Summaries
    - POS / business context
    - Any explanatory or contextual text
    """

    COLLECTION_NAME = "text_vectors"
    VECTOR_SIZE = 1024  # CLIP text / other text models should match this
    DISTANCE = Distance.COSINE

    def __init__(
        self,
        qdrant: QdrantClientWrapper,
        score_threshold: float = 0.75,
        top_k: int = 5,
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

    def search_relevant(
        self,
        embedding: List[float],
        source: Optional[str] = None,
    ):
        """
        Search for relevant text entries.

        'source' can be used to filter by origin:
        - 'vlm'
        - 'pos'
        - 'summary'
        """
        try:
            hits = self._qdrant.search(
                collection_name=self.COLLECTION_NAME,
                vector=embedding,
                limit=self._top_k,
                score_threshold=self._score_threshold,
            )

            if source:
                hits = [
                    h for h in hits
                    if h.payload and h.payload.get("source") == source
                ]

            return hits

        except Exception as e:
            logger.error("TextIndex search failed", exc_info=e)
            return []

    def add(
        self,
        embedding: List[float],
        text: str,
        source: str,
        ref_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        timestamp: Optional[float] = None,
    ) -> Optional[str]:
        """
        Store a text embedding.

        Parameters:
        - text: the original text (stored in payload)
        - source: origin of the text (e.g. 'vlm', 'pos')
        - ref_id: optional reference (camera_id, receipt_id, etc.)
        """
        payload = {
            "text": text,
            "source": source,
            "timestamp": timestamp or time(),
        }

        if ref_id:
            payload["ref_id"] = ref_id

        if metadata:
            payload.update(metadata)

        return self._qdrant.upsert(
            collection_name=self.COLLECTION_NAME,
            vector=embedding,
            payload=payload,
        )
