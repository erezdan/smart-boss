from typing import List, Optional
from uuid import uuid4
from typing import Any
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, Range

from utils.logger import logger

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance, PointStruct, Prefetch, SearchRequest
except ImportError:
    QdrantClient = None
    VectorParams = None
    Distance = None
    PointStruct = None


class QdrantClientWrapper:
    """
    Low-level, safe wrapper around Qdrant.
    Responsible ONLY for raw vector DB operations.
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6333,
    ):
        if QdrantClient is None:
            raise RuntimeError("qdrant-client is not installed")

        try:
            self._client = QdrantClient(
                host=host,
                port=port,
                prefer_grpc=False,
            )
        except Exception as e:
            logger.error("Failed to initialize Qdrant client", exc_info=e)
            raise

    def ensure_collection(
        self,
        collection_name: str,
        vector_size: int,
        distance: Any = Distance.COSINE,
    ) -> None:
        """
        Ensure a collection exists with the given vector configuration.
        Idempotent.
        """
        try:
            collections = self._client.get_collections().collections
            if any(c.name == collection_name for c in collections):
                return

            self._client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=distance,
                ),
            )

            logger.log(f"Qdrant collection created: {collection_name}")

        except Exception as e:
            logger.error(
                f"Failed to ensure Qdrant collection '{collection_name}'",
                exc_info=e,
            )
            raise

    def upsert(
        self,
        collection_name: str,
        vector: List[float],
        payload: Optional[dict] = None,
        point_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Insert or update a vector.
        Returns point_id on success.
        """
        try:
            pid = point_id or str(uuid4())

            self._client.upsert(
                collection_name=collection_name,
                points=[
                    PointStruct(
                        id=pid,
                        vector=vector,
                        payload=payload or {},
                    )
                ],
            )

            return pid

        except Exception as e:
            logger.error(
                f"Qdrant upsert failed | collection={collection_name}",
                exc_info=e,
            )
            return None

    def search(
        self,
        collection_name: str,
        vector: list[float],
        limit: int,
        score_threshold: float | None = None,
    ):
        """
        Vector similarity search (Qdrant Python SDK).
        """
        try:
            return self._client.query_points(
                collection_name=collection_name,
                query=vector,
                limit=limit,
                score_threshold=score_threshold,
            )
        except Exception as e:
            logger.error(
                f"Qdrant search failed | collection={collection_name}",
                exc_info=e,
            )
            return []
        
    def scroll(
        self,
        collection_name: str,
        limit: int = 1000,
        offset=None,
        with_payload: bool = True,
    ):
        return self._client.scroll(
            collection_name=collection_name,
            limit=limit,
            offset=offset,
            with_payload=with_payload,
        )
    
    def set_payload_by_point_ids(
        self,
        collection_name: str,
        point_ids: list,
        payload: dict,
    ) -> None:
        """
        Update payload fields for specific points.
        """
        if not point_ids:
            return

        try:
            try:
                self._client.set_payload(
                    collection_name=collection_name,
                    payload=payload,
                    points=point_ids,
                )
            except TypeError:
                self._client.set_payload(
                    collection_name=collection_name,
                    payload=payload,
                    points_selector=point_ids,
                )

        except Exception as e:
            logger.error(
                "Qdrant set_payload_by_point_ids failed",
                exc_info=e,
            )
            raise

    def delete_by_filter(
        self,
        collection_name: str,
        filter: dict,
    ) -> None:
        """
        Delete points from a collection using a payload filter.
        """
        try:
            must_conditions = []

            for cond in filter.get("must", []):
                key = cond.get("key")
                range_cond = cond.get("range")
                match_cond = cond.get("match")

                if key and range_cond:
                    must_conditions.append(
                        FieldCondition(
                            key=key,
                            range=Range(
                                gte=range_cond.get("gte"),
                                lte=range_cond.get("lte"),
                            ),
                        )
                    )
                elif key and match_cond and "value" in match_cond:
                    must_conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=match_cond.get("value")),
                        )
                    )

            qdrant_filter = Filter(must=must_conditions)

            self._client.delete(
                collection_name=collection_name,
                points_selector=qdrant_filter,
            )

        except Exception as e:
            logger.error(
                "Qdrant delete_by_filter failed",
                exc_info=e,
            )
            raise



