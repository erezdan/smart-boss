# cycle_traning_image_pipeline.py

import cv2
from typing import Optional

from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from embeddings.clip_embeddings import embed_image_sync
from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex


class CycleTrainingImagePipeline:
    """
    Pipeline for training-time image ingestion.

    Purpose:
    - Capture dense visual representation of a machine cycle
    - Store CLIP embeddings into a dedicated vector index
    - No VLM, no similarity search, minimal gating
    """

    def __init__(self):
        qdrant_client = QdrantClientWrapper()

        self._image_index = ImageIndex(
            qdrant=qdrant_client,
            #index_name="cycle_training_images",
            score_threshold=None,
            top_k=None,
        )

        self.prev_image_embedding: dict[str, list[float]] = {}

    def process_snapshot(self, event: SnapshotEvent) -> None:
        """
        Training ingestion entry point.
        Must never raise.
        """

        frame = event.frame
        if frame is None:
            return

        image_buffer = self._frame_to_jpeg(frame)
        if not image_buffer:
            return

        try:
            embedding = embed_image_sync(image_buffer)
        except Exception as e:
            logger.error(
                f"CLIP embedding failed | camera={event.camera_id}",
                exc_info=e,
            )
            return

        if not embedding:
            return

        # Optional: ultra-high similarity gate (anti-freeze)
        if self._is_similar_to_previous_image(
            camera_id=event.camera_id,
            new_embedding=embedding,
            threshold=0.99,
        ):
            return

        # Store every accepted frame
        self._image_index.add(
            embedding=embedding,
            camera_id=event.camera_id,
            timestamp=event.timestamp,
            frame_description=None,  # training phase – no text
            metadata={
                "pipeline": "cycle_training",
                "camera_id": event.camera_id,
            },
        )

    def _frame_to_jpeg(
        self,
        frame,
        max_width: int = 384,
        jpeg_quality: int = 60,
    ) -> Optional[bytes]:
        """
        Convert OpenCV frame to lightweight JPEG bytes.
        """
        try:
            height, width = frame.shape[:2]

            if width > max_width:
                scale = max_width / float(width)
                new_size = (max_width, int(height * scale))
                frame = cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)

            success, buffer = cv2.imencode(
                ".jpg",
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), jpeg_quality],
            )
            if not success:
                return None

            return buffer.tobytes()

        except Exception as e:
            logger.error("JPEG encoding failed", exc_info=e)
            return None

    def _is_similar_to_previous_image(
        self,
        camera_id: str,
        new_embedding: list[float],
        threshold: float,
    ) -> bool:
        """
        Extremely high-threshold similarity gate.
        Used only to skip identical frames.
        """

        try:
            prev = self.prev_image_embedding.get(camera_id)

            if prev is None:
                self.prev_image_embedding[camera_id] = new_embedding
                return False

            similarity = sum(a * b for a, b in zip(new_embedding, prev))

            if similarity < threshold:
                self.prev_image_embedding[camera_id] = new_embedding
                return False

            return True

        except Exception:
            self.prev_image_embedding[camera_id] = new_embedding
            return False
