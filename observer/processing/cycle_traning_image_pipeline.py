# cycle_traning_image_pipeline.py

import cv2
from typing import Optional
import os
from datetime import datetime
import torch

from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from embeddings.clip_embeddings import embed_image_sync, merge_embeddings
from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex


class CycleTrainingImagePipeline:
    """
    Pipeline for training-time image ingestion.

    Purpose:
    - Capture dense visual representation of a machine cycle
    - Store stabilized CLIP embeddings into a dedicated vector index
    - No VLM, no runtime similarity search
    """

    def __init__(self):
        qdrant_client = QdrantClientWrapper()

        self._image_index = ImageIndex(
            qdrant=qdrant_client,
            score_threshold=None,
            top_k=None,
        )

        # Static per-frame embeddings (anti-freeze gate)
        self.prev_frame_embedding: dict[str, list[float]] = {}

        # Rolling merged embeddings (stabilized representation)
        self.rolling_embedding: dict[str, torch.Tensor] = {}

        # Anchor and ingestion counters
        self._next_anchor_id: int = 1
        self._ingest_seq: int = 1

        # Training control
        self._max_training_vectors: int = 2000
        self._pruned: bool = False

        # Image files path
        self._image_storage_path: str = "c:/smart-boss-files/images/training/"
        os.makedirs(self._image_storage_path, exist_ok=True)

    def process_snapshot(self, event: SnapshotEvent) -> None:
        """
        Training ingestion entry point.
        Must never raise.
        """

        # Stop training and prune once max size is reached
        if not self._pruned and self._ingest_seq > self._max_training_vectors:
            self._image_index.delete_by_ingest_percent(30.0, self._ingest_seq)
            self._pruned = True
            self._image_index.print_anchor_distribution()
            return

        # If already pruned, stop training completely
        if self._pruned:
            return

        # Obtain current frame embedding
        curr_embedding = self._get_curr_embedding(event)
        if not curr_embedding:
            return

        # Ultra-high similarity gate (static frame de-duplication)
        if self._is_similar_to_previous_frame(
            camera_id=event.camera_id,
            new_embedding=curr_embedding,
            threshold=0.99,
        ):
            return

        # Update static frame reference
        self.prev_frame_embedding[event.camera_id] = curr_embedding

        # Rolling merge (stabilized embedding)
        curr_tensor = torch.tensor(curr_embedding)

        prev_rolling = self.rolling_embedding.get(event.camera_id)
        if prev_rolling is None:
            merged_tensor = curr_tensor
        else:
            merged_tensor = merge_embeddings(prev_rolling, curr_tensor)

        self.rolling_embedding[event.camera_id] = merged_tensor

        # Determine anchor_id via similarity search
        anchor_id = None

        threshold = self._get_dynamic_similarity_threshold()

        matches = self._image_index.search_similar(
            embedding=curr_embedding,
            camera_id=event.camera_id,
            top_k=8,
            score_threshold=threshold,
        )
        
        score = 0.0

        if matches:
            # Assume best match is the first result
            best_match = matches[0]
            anchor_id = best_match.payload.get("anchor_id")
            score = best_match.score

        if anchor_id is None:
            anchor_id = self._next_anchor_id
            self._next_anchor_id += 1

        # Assign ingestion sequence number
        ingest_seq = self._ingest_seq
        self._ingest_seq += 1

        # Save frame image under anchor directory
        self._save_frame_image(
            frame=event.frame,
            camera_id=event.camera_id,
            anchor_id=anchor_id,
            ingest_seq=ingest_seq,
            timestamp=event.timestamp,
        )

        # Store stabilized embedding with metadata
        self._image_index.add(
            embedding=curr_embedding,
            camera_id=event.camera_id,
            timestamp=event.timestamp,
            frame_description=None,
            metadata={
                "pipeline": "cycle_training",
                "camera_id": event.camera_id,
                "anchor_id": anchor_id,
                "ingest_seq": ingest_seq,
            },
        )

        print(
            f"Training ingest | camera={event.camera_id} "
            f"ingest_seq={ingest_seq} anchor_id={anchor_id} score={score:.3f}"
        )

    def _get_dynamic_similarity_threshold(self) -> float:
        base_threshold = 0.988
        step = 0.003
        step_size = 100
        max_threshold = 0.99

        steps = self._ingest_seq // step_size
        threshold = base_threshold + (steps * step)

        if threshold > max_threshold:
            threshold = max_threshold

        return threshold

    def _get_curr_embedding(self, event: SnapshotEvent):
        frame = event.frame
        if frame is None:
            return None

        image_buffer = self._frame_to_jpeg(frame)
        if not image_buffer:
            return None

        try:
            curr_embedding = embed_image_sync(image_buffer)
        except Exception as e:
            logger.error(
                f"CLIP embedding failed | camera={event.camera_id}",
                exc_info=e,
            )
            return None
        
        return curr_embedding

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

    def _is_similar_to_previous_frame(
        self,
        camera_id: str,
        new_embedding: list[float],
        threshold: float,
    ) -> bool:
        """
        Extremely high-threshold static similarity gate.
        Used only to skip identical frames.
        """
        try:
            prev = self.prev_frame_embedding.get(camera_id)
            if prev is None:
                return False

            similarity = sum(a * b for a, b in zip(new_embedding, prev))
            return similarity >= threshold

        except Exception:
            return False
        

    def _save_frame_image(
        self,
        frame,
        camera_id: str,
        anchor_id: int,
        ingest_seq: int,
        timestamp,
    ) -> None:
        """
        Save frame image under anchor-specific directory.
        Never raises.
        """
        try:
            anchor_dir = os.path.join(
                self._image_storage_path,
                f"anchor_{anchor_id:04d}"
            )
            os.makedirs(anchor_dir, exist_ok=True)

            ts_str = (
                timestamp.strftime("%Y%m%d_%H%M%S_%f")
                if isinstance(timestamp, datetime)
                else str(timestamp)
            )

            filename = (
                f"{camera_id}_"
                f"seq_{ingest_seq:06d}_"
                f"{ts_str}.jpg"
            )

            file_path = os.path.join(anchor_dir, filename)

            cv2.imwrite(file_path, frame)

        except Exception as e:
            logger.error(
                f"Failed to save training image | "
                f"anchor_id={anchor_id} ingest_seq={ingest_seq}",
                exc_info=e,
            )

 

