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

    def delete_anchors_below_average_vector_count(self) -> int:
        """
        Delete weak visual anchors and renumber the remaining anchors.

        Only cycle training anchors are considered, so other logical records in
        the shared image collection are not pruned accidentally.

        Returns:
            The next available anchor_id after renumbering.
        """

        next_anchor_id = 1

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

                    if payload.get("pipeline") != "cycle_training":
                        continue

                    anchor_id = payload.get("anchor_id")
                    if anchor_id is None:
                        continue

                    anchor_counts[anchor_id] = anchor_counts.get(anchor_id, 0) + 1

                if offset is None:
                    break

            total_anchors = len(anchor_counts)
            if total_anchors == 0:
                logger.log("No cycle training anchors found for average pruning")
                return 1

            next_anchor_id = max(anchor_counts.keys()) + 1

            total_vectors = sum(anchor_counts.values())
            average = total_vectors / total_anchors
            anchors_to_delete = [
                anchor_id
                for anchor_id, count in anchor_counts.items()
                if count < average
            ]

            if anchors_to_delete:
                logger.log(
                    f"Deleting anchors below average vector count | "
                    f"average={average:.2f} anchors={anchors_to_delete}"
                )

                for anchor_id in anchors_to_delete:
                    self._qdrant.delete_by_filter(
                        collection_name=self.COLLECTION_NAME,
                        filter={
                            "must": [
                                {
                                    "key": "pipeline",
                                    "match": {
                                        "value": "cycle_training"
                                    },
                                },
                                {
                                    "key": "anchor_id",
                                    "match": {
                                        "value": anchor_id
                                    },
                                },
                            ]
                        },
                    )
            else:
                logger.log(
                    f"No anchors below average vector count | average={average:.2f}"
                )

            remaining_anchor_points = self._get_cycle_training_anchor_points()
            if not remaining_anchor_points:
                logger.log("No cycle training anchors remain after pruning")
                return 1

            anchor_id_mapping = {
                old_anchor_id: new_anchor_id
                for new_anchor_id, old_anchor_id in enumerate(
                    sorted(remaining_anchor_points.keys()),
                    start=1,
                )
            }

            for old_anchor_id, new_anchor_id in anchor_id_mapping.items():
                if old_anchor_id == new_anchor_id:
                    continue

                self._qdrant.set_payload_by_point_ids(
                    collection_name=self.COLLECTION_NAME,
                    point_ids=remaining_anchor_points[old_anchor_id],
                    payload={
                        "anchor_id": new_anchor_id
                    },
                )

            next_anchor_id = max(anchor_id_mapping.values()) + 1

            logger.log(
                f"Renumbered cycle training anchors | "
                f"mapping={anchor_id_mapping} next_anchor_id={next_anchor_id}"
            )

            return next_anchor_id

        except Exception as e:
            logger.error(
                "Failed to delete anchors below average vector count",
                exc_info=e,
            )
            return next_anchor_id

    def _get_cycle_training_anchor_points(self) -> dict[int, list]:
        """
        Return point ids grouped by cycle training anchor_id.
        """

        offset = None
        anchor_points: dict[int, list] = {}

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

                if payload.get("pipeline") != "cycle_training":
                    continue

                anchor_id = payload.get("anchor_id")
                if anchor_id is None:
                    continue

                anchor_points.setdefault(anchor_id, []).append(p.id)

            if offset is None:
                break

        return anchor_points

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
