import cv2
from typing import Optional

from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from embeddings.clip_embeddings import embed_image
from embeddings.text_embeddings import embed_text

from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex
from vector_store.text_index import TextIndex
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
        self._text_index = TextIndex(
            qdrant=qdrant_client,
        )
        self.prev_image_embedding: dict[str, list[float]] = {}
        self.prev_rolling_context: dict[str, str] = {}
        self._vlm = VLMClient(base_url=settings.VLM_BASE_URL)

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
        prompt = build_image_analysis_prompt(
            business_name="Video ABC",
            business_type="Video Store",
            camera_name="Front Counter",
            camera_description="Facing the cashier and customer waiting area",
            analysis_goal="Detect meaningful changes in customer flow and staff activity",
            previous_rolling_context=self.prev_rolling_context.get(event.camera_id, ""),
        )
        analysis = self._vlm.analyze_image(
            image_buffer=image_buffer,
            prompt=prompt,
            model=settings.VLM_MODEL,
            metadata={
                "camera_id": event.camera_id,
                "timestamp": event.timestamp,
            },
        )

        self.prev_rolling_context[event.camera_id] = analysis.get("rolling_context", "")

        # 6. No similar image found -> store embedding
        point_id = self._image_index.add(
            embedding=embedding,
            camera_id=event.camera_id,
            timestamp=event.timestamp,
            frame_description=analysis["frame_description"],
        )
        if not point_id:
            logger.error(
                f"Failed to store new image embedding | camera={event.camera_id}"
            )

        # 7. text embedding (async, fire-and-forget)
        try:
            text_embedding = await embed_text(analysis["frame_description"])
        except Exception as e:
            logger.error(
                f"Text embedding failed | camera={event.camera_id}",
                exc_info=e,
            )
        
        # 8. Store text embedding
        if text_embedding:
            self._text_index.add(
                embedding=text_embedding,
                frame_description=analysis["frame_description"],
                rolling_context=analysis["rolling_context"],
                source="vlm",
                ref_id=point_id,
                metadata={
                    "camera_id": event.camera_id,
                    "timestamp": event.timestamp,
                },
            )

        print("Frame description: " + analysis["frame_description"])
        print("Rolling context: " + analysis["rolling_context"])

    def _frame_to_jpeg(
        self,
        frame,
        max_width: int = 384,
        jpeg_quality: int = 60,
    ) -> Optional[bytes]:
        """
        Convert OpenCV frame (BGR numpy array) to resized JPEG bytes.
        Optimized for VLM usage.
        """
        try:
            height, width = frame.shape[:2]

            # Resize if needed (keep aspect ratio)
            if width > max_width:
                scale = max_width / float(width)
                new_size = (max_width, int(height * scale))
                frame = cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)

            encode_params = [
                int(cv2.IMWRITE_JPEG_QUALITY),
                jpeg_quality,
            ]

            success, buffer = cv2.imencode(".jpg", frame, encode_params)
            if not success:
                return None

            image_bytes = buffer.tobytes()
            #print(f"JPEG bytes being sent: {len(image_bytes)/1024:.1f} KB")
            return image_bytes

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