from typing import List, Optional

from utils.logger import logger

try:
    from qdrant_client import QdrantClient
except ImportError:
    QdrantClient = None


class SimilarityResult:
    """
    Represents a single similarity match.
    """

    def __init__(self, id: str, score: float, payload: dict):
        self.id = id
        self.score = score
        self.payload = payload


class SimilaritySearcher:
    """
    Handles vector similarity search against Qdrant.
    Read-only responsibility.
    """

    def __init__(
        self,
        collection_name: str,
        host: str = "localhost",
        port: int = 6333,
        score_threshold: float = 0.85,
        top_k: int = 3,
    ):
        self.collection_name = collection_name
        self.score_threshold = score_threshold
        self.top_k = top_k

        if QdrantClient is None:
            raise RuntimeError("qdrant-client is not installed")

        try:
            self._client = QdrantClient(host=host, port=port)
        except Exception as e:
            logger.error("Failed to initialize QdrantClient", exc_info=e)
            raise

    def search(self, embedding: List[float]) -> List[SimilarityResult]:
        """
        Perform similarity search.
        Never raises.
        """
        try:
            hits = self._client.search(
                collection_name=self.collection_name,
                query_vector=embedding,
                limit=self.top_k,
                score_threshold=self.score_threshold,
            )

            results: List[SimilarityResult] = []

            for hit in hits:
                results.append(
                    SimilarityResult(
                        id=str(hit.id),
                        score=hit.score,
                        payload=hit.payload or {},
                    )
                )

            return results

        except Exception as e:
            logger.error("Similarity search failed", exc_info=e)
            return []
