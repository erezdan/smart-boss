# cycle_image_pipeline.py

import os
from PIL import Image
import cv2
from typing import Optional

import numpy as np

from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from embeddings.clip_embeddings import embed_image_sync
from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex


class CycleImagePipeline:
    """
    Runtime pipeline for cycle anomaly detection.

    Purpose:
    - Run during machine operation
    - Embed each frame
    - Compare against trained cycle vectors
    - Detect anomalies based on similarity drop
    """

    def __init__(
        self,
        anomaly_threshold: float = 0.97,
        static_frame_threshold: float = 0.995,
    ):
        qdrant_client = QdrantClientWrapper()

        self._image_index = ImageIndex(
            qdrant=qdrant_client,
            score_threshold=None,
            top_k=None,
        )

        # Static frame de-duplication
        self.prev_frame_embedding: dict[str, list[float]] = {}

        self._anomaly_threshold = anomaly_threshold
        self._static_frame_threshold = static_frame_threshold

        # Anomaly images path
        self._image_anomaly_path: str = "c:/smart-boss-files/images/anomaly/"
        os.makedirs(self._image_anomaly_path, exist_ok=True)

    def process_snapshot(self, event: SnapshotEvent) -> None:
        """
        Runtime inference entry point.
        Must never raise.
        """

        curr_embedding = self._get_curr_embedding(event)
        if not curr_embedding:
            return

        # Skip identical frames
        if self._is_similar_to_previous_frame(
            camera_id=event.camera_id,
            new_embedding=curr_embedding,
            threshold=self._static_frame_threshold,
        ):
            return

        self.prev_frame_embedding[event.camera_id] = curr_embedding

        # Similarity search against trained cycle
        matches = self._image_index.search_similar(
            embedding=curr_embedding,
            camera_id=event.camera_id,
            top_k=5,
            score_threshold=None,
        )

        if not matches:
            self._report_anomaly(
                event,
                reason="no_similar_vectors",
                similarity=0.0,
            )
            return

        best_match = matches[0]
        similarity = best_match.score

        print(f"Cycle similarity | camera={event.camera_id} anchor_id={best_match.payload.get('anchor_id')} similarity={similarity:.4f}")

        if similarity < self._anomaly_threshold:
            self._report_anomaly(
                event,
                reason="similarity_drop",
                similarity=similarity,
                anchor_id=best_match.payload.get("anchor_id"),
            )

    def _report_anomaly(
        self,
        event: SnapshotEvent,
        reason: str,
        similarity: float,
        anchor_id: Optional[int] = None,
    ) -> None:
        """
        Central anomaly hook.
        Can later trigger alerts, VLM, logging, etc.
        """

        print(
            f"Cycle anomaly detected | "
            f"camera={event.camera_id} "
            f"reason={reason} "
            f"similarity={similarity:.4f} "
            f"anchor_id={anchor_id}"
        )

    def _get_curr_embedding(self, event: SnapshotEvent):
        frame = event.frame
        if frame is None:
            return None

        image_buffer = self._frame_to_jpeg(frame)
        if not image_buffer:
            return None

        try:
            return embed_image_sync(image_buffer)
        except Exception as e:
            logger.error(
                f"CLIP embedding failed | camera={event.camera_id}",
                exc_info=e,
            )
            return None

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
                image = self.get_anomaly_image()
                if image is not None:
                    # Convert PIL Image to OpenCV format
                    frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

                # Resize applies to BOTH cases
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

    def get_anomaly_image(self) -> None:
        # Find all .jpg files in the directory
        jpg_files = [
            f for f in os.listdir(self._image_anomaly_path)
            if f.lower().endswith(".jpg")
        ]

        if len(jpg_files) == 0:
            return None

        if len(jpg_files) > 1:
            return None

        # Build full path to the image
        image_path = os.path.join(self._image_anomaly_path, jpg_files[0])

        # Open and display the image
        image = Image.open(image_path)
        return image

    def _is_similar_to_previous_frame(
        self,
        camera_id: str,
        new_embedding: list[float],
        threshold: float,
    ) -> bool:
        try:
            prev = self.prev_frame_embedding.get(camera_id)
            if prev is None:
                return False

            similarity = sum(a * b for a, b in zip(new_embedding, prev))
            return similarity >= threshold

        except Exception:
            return False
