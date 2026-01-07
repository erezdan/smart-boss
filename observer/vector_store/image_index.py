from typing import List, Optional
from time import time, perf_counter
from datetime import datetime
from typing import List, Optional

from qdrant_client.models import Distance # type: ignore[unused-import]
from config import settings

from utils.logger import logger
from vector_store.qdrant_wrapper import QdrantClientWrapper

class ImageIndex:
    """
    Semantic index for image embeddings.
    Represents visual memory.
    """

    COLLECTION_NAME = settings.VECTOR_STORE_NAMESPACE
    VECTOR_SIZE = settings.VECTOR_SIZE  # CLIP ViT-B/16
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
        embedding: list[float],
        camera_id: Optional[str] = None,
        top_k: Optional[int] = None,
        score_threshold: Optional[float] = None,
    ):
        try:
            response = self._qdrant.search(
                collection_name=self.COLLECTION_NAME,
                vector=embedding,
                limit=top_k or self._top_k,
                score_threshold=score_threshold or self._score_threshold,
            )

            hits = response.points

            filtered = []
            for h in hits:
                payload = h.payload or {}

                if camera_id and payload.get("camera_id") != camera_id:
                    continue

                filtered.append(h)

            return filtered

        except Exception as e:
            logger.error(
                "ImageIndex training similarity search failed",
                exc_info=e,
            )
            return []

    def search_similar_last_minute(
        self,
        embedding: list[float],
        camera_id: Optional[str] = None,
        top_k: Optional[int] = None,
        score_threshold: Optional[float] = None,
    ):
        """
        Search for visually similar images from the last minute only.
        """
        try:
            response = self._qdrant.search(
                collection_name=self.COLLECTION_NAME,
                vector=embedding,
                limit=top_k or self._top_k,
                score_threshold=score_threshold or self._score_threshold,
            )

            hits = response.points  # List[ScoredPoint]

            now = time()
            cutoff = now - 60  # last 60 seconds

            filtered = []
            for h in hits:
                payload = h.payload or {}

                ts = payload.get("timestamp")
                if ts is None or ts < cutoff:
                    continue

                if camera_id and payload.get("camera_id") != camera_id:
                    continue

                filtered.append(h)

            return filtered

        except Exception as e:
            logger.error(
                "ImageIndex similarity search failed",
                exc_info=e,
            )
            return []

    def add(
        self,
        embedding: List[float],
        camera_id: str,
        timestamp: Optional[float] = None,
        metadata: Optional[dict] = None,
        frame_description: Optional[str] = None,
    ) -> Optional[str]:
        """
        Store a new image embedding in the index.
        """

        ts = timestamp or time()

        payload = {
            "type": "clip_image",
            "camera_id": camera_id,
            "timestamp": ts,  # raw unix timestamp (for logic / filtering)
            "timestamp_str": datetime.fromtimestamp(ts).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),  # human-readable (for UI/debug)
            "frame_description": frame_description,
        }

        if metadata:
            payload.update(metadata)

        start_ts = perf_counter()
        try:
            result = self._qdrant.upsert(
                collection_name=self.COLLECTION_NAME,
                vector=embedding,
                payload=payload,
            )
            return result
        finally:
            elapsed_ms = (perf_counter() - start_ts) * 1000
            #print(f"Vector DB upsert time: {elapsed_ms:.2f} ms | camera={camera_id}")
            

    def add_clip_text(
        self,
        embedding: List[float],
        clip_text: str,
        camera_id: Optional[str] = None,
        timestamp: Optional[float] = None,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Store a CLIP text embedding in the index.
        """

        ts = timestamp or time()

        payload = {
            "type": "clip_text",
            "clip_text": clip_text,
            "timestamp": ts,
            "timestamp_str": datetime.fromtimestamp(ts).strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
        }

        if camera_id:
            payload["camera_id"] = camera_id

        if metadata:
            payload.update(metadata)

        return self._qdrant.upsert(
            collection_name=self.COLLECTION_NAME,
            vector=embedding,
            payload=payload,
        )

    def delete_by_ingest_percent(self, percent: float, ingest_seq: int) -> None:
        """
        Delete oldest vectors by ingest_seq percentage.

        Args:
            percent: float between 0 and 100.
                    Example: 30.0 will delete the oldest 30% of ingested vectors.
        """

        if percent <= 0 or percent >= 100:
            logger.error(f"Invalid prune percent: {percent}")
            return

        try:
            # Determine cutoff ingest_seq
            total_ingested = ingest_seq - 1
            if total_ingested <= 0:
                return

            cutoff_seq = int(total_ingested * (percent / 100.0))

            if cutoff_seq <= 0:
                return

            logger.log(
                f"Pruning vectors with ingest_seq <= {cutoff_seq} "
                f"({percent:.1f}% of {total_ingested})"
            )

            # Delete by payload filter
            self._qdrant.delete_by_filter(
                collection_name=self.COLLECTION_NAME,
                filter={
                    "must": [
                        {
                            "key": "ingest_seq",
                            "range": {
                                "lte": cutoff_seq
                            },
                        }
                    ]
                },
            )


        except Exception as e:
            logger.error("Failed to prune vectors by ingest_seq", exc_info=e)

    def print_anchor_distribution(self) -> None:
        """
        Print anchor_id distribution in the vector index.
        """

        try:
            offset = None
            anchor_counts: dict[int, int] = {}

            while True:
                points, offset = self._qdrant.scroll(
                    collection_name=self.COLLECTION_NAME,
                    limit=1000,
                    offset=offset,
                    with_payload=True,
                )

                if not points:
                    break

                for p in points:
                    payload = p.payload or {}
                    anchor_id = payload.get("anchor_id")

                    if anchor_id is None:
                        continue

                    anchor_counts[anchor_id] = anchor_counts.get(anchor_id, 0) + 1

                if offset is None:
                    break

            print("Anchor distribution:")
            for anchor_id in sorted(anchor_counts.keys()):
                print(f"anchor_id={anchor_id} | count={anchor_counts[anchor_id]}")

            print(f"Total anchors: {len(anchor_counts)}")

        except Exception as e:
            logger.error("Failed to print anchor distribution", exc_info=e)
