import cv2
from typing import Optional

from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from embeddings.clip_embeddings import embed_image

from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex
from cloud.vlm_client import VLMClient
from config import settings
from prompts.image_analysis_prompt import build_image_analysis_prompt

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
        self.prev_image_embedding: dict[str, list[float]] = {}

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

        # 4. Similaryty against previos embeddings
        matches = self._is_similar_to_previous_image(
            camera_id=event.camera_id,
            new_embedding=embedding)
        if matches:
            # Similar image already exists -> no write, no VLM
            return

        # 5. Similarity search (vector db)
        matches = self._image_index.search_similar(
            embedding=embedding,
            camera_id=event.camera_id,
        )
        if matches:
            # Similar image already exists -> no write, no VLM
            return

        # 6. Analyze the image with VLM
        self._vlm = VLMClient(base_url=settings.VLM_BASE_URL)
        prompt = build_image_analysis_prompt(
            business_name="Video ABC",
            business_type="Video Store",
            camera_name="Front Counter",
            camera_description="Facing the cashier and customer waiting area",
            analysis_goal="Detect meaningful changes in customer flow and staff activity",
            previous_state="One customer waiting at the counter",
        )
        analysis = self._vlm.analyze_image(
            image_buffer=image_buffer,
            prompt="",
            model=settings.VLM_MODEL,
            metadata={
                "camera_id": event.camera_id,
                "timestamp": event.timestamp,
            },
        )

        # 6. No similar image found -> store embedding
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
        
    def _is_similar_to_previous_image(
        self,
        camera_id: str,
        new_embedding: list[float],
        threshold: float = 0.95,
    ) -> bool:
        """
        CLIP-native image-to-image similarity check.
        Must never raise.
        Assumes embeddings are L2-normalized.
        """

        try:
            prev = self.prev_image_embedding.get(camera_id)

            # First frame or invalid previous state
            if prev is None:
                self.prev_image_embedding[camera_id] = new_embedding
                return False

            # Defensive: length mismatch
            if len(new_embedding) != len(prev):
                self.prev_image_embedding[camera_id] = new_embedding
                return False

            similarity = sum(a * b for a, b in zip(new_embedding, prev))

            # Update previous embedding only on meaningful change
            if similarity < threshold:
                self.prev_image_embedding[camera_id] = new_embedding

            return similarity >= threshold

        except Exception as e:
            # Gate must never break the pipeline
            logger.error(
                "Local image similarity check failed",
                exc_info=e,
            )
            self.prev_image_embedding[camera_id] = new_embedding
            return False


