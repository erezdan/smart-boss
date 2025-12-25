import cv2
from typing import Optional

from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from embeddings.clip_embeddings import embed_image

from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex


class ImagePipeline:
    """
    Image processing pipeline.

    Flow:
    SnapshotEvent
        -> frame (numpy)
        -> JPEG encoding
        -> CLIP image embedding
        -> similarity search (ImageIndex)
        -> if no similar image found -> store embedding in Qdrant
    """

    def __init__(self):
        qdrant_client = QdrantClientWrapper()

        self._image_index = ImageIndex(
            qdrant=qdrant_client,
            score_threshold=0.85,
            top_k=3,
        )

    async def process_snapshot(self, event: SnapshotEvent) -> None:
        """
        Entry point for image pipeline.
        Must never raise.
        """

        # 1. Validate input early
        frame = event.frame
        if frame is None:
            return

        # 2. Convert frame to JPEG buffer
        image_buffer = self._frame_to_jpeg(frame)
        if not image_buffer:
            return

        # 3. Generate CLIP embedding
        try:
            embedding = await embed_image(image_buffer)
        except Exception as e:
            logger.error(
                f"CLIP embedding failed | camera={event.camera_id}",
                exc_info=e,
            )
            return

        if not embedding:
            logger.error(
                f"Empty embedding generated | camera={event.camera_id}"
            )
            return

        # 4. Similarity search (visual memory)
        matches = self._image_index.search_similar(
            embedding=embedding,
            camera_id=event.camera_id,
        )

        if matches:
            # Similar image already exists -> no write, no VLM
            return

        # 5. No similar image found -> store embedding
        point_id = self._image_index.add(
            embedding=embedding,
            camera_id=event.camera_id,
            timestamp=event.timestamp,
        )

        if point_id:
            logger.log(
                f"New image stored | camera={event.camera_id} "
                f"point_id={point_id}"
            )

    def _frame_to_jpeg(self, frame) -> Optional[bytes]:
        """
        Convert OpenCV frame (BGR numpy array) to JPEG bytes.
        """
        try:
            success, buffer = cv2.imencode(".jpg", frame)
            if not success:
                return None

            return buffer.tobytes()

        except Exception as e:
            logger.error("Failed to encode frame to JPEG", exc_info=e)
            return None
