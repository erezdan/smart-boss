# cycle_image_pipeline.py

import os
import re
from PIL import Image
import cv2
from typing import Callable, Optional

import numpy as np

from config import settings
from utils.logger import logger
from cameras.camera_events import SnapshotEvent
from cloud.vlm_client import VLMClient
from embeddings.clip_embeddings import embed_image_sync
from vector_store.qdrant_wrapper import QdrantClientWrapper
from vector_store.image_index import ImageIndex
from websocket.schemas import make_event


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPTS_DIR = os.path.join(BASE_DIR, "prompts")
ANCHOR_SCENE_CONTEXT_PROMPT_PATH = os.path.join(
    PROMPTS_DIR,
    "cycle_anchor_scene_context.txt",
)
ANOMALY_EXPLANATION_PROMPT_PATH = os.path.join(
    PROMPTS_DIR,
    "anomaly_explanation_prompt.txt",
)


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
        event_callback: Optional[Callable[[dict], None]] = None,
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
        self._event_callback = event_callback
        self._vlm = VLMClient(base_url=settings.VLM_BASE_URL)

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
            score_threshold=self._static_frame_threshold,
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
        anchor_id = best_match.payload.get("anchor_id")

        print(f"Cycle similarity | camera={event.camera_id} anchor_id={anchor_id} similarity={similarity:.4f}")

        self._publish_event(
            make_event(
                "prediction",
                event.camera_id,
                {
                    "status": "normal" if similarity >= self._anomaly_threshold else "anomaly",
                    "similarity": similarity,
                    "threshold": self._anomaly_threshold,
                    "anchor_id": anchor_id,
                    "reason": None if similarity >= self._anomaly_threshold else "similarity_drop",
                },
                timestamp=event.timestamp,
            )
        )

        if similarity < self._anomaly_threshold:
            self._report_anomaly(
                event,
                reason="similarity_drop",
                similarity=similarity,
                anchor_id=anchor_id,
            )
            return

        self._ensure_anchor_description(event, anchor_id)

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

        explanation = self._explain_anomaly(
            event=event,
            reason=reason,
            similarity=similarity,
            anchor_id=anchor_id,
        )

        self._publish_event(
            make_event(
                "anomaly",
                event.camera_id,
                {
                    "reason": explanation["short_reason"],
                    "technical_reason": reason,
                    "similarity": similarity,
                    "threshold": self._anomaly_threshold,
                    "anchor_id": anchor_id,
                    "detailed_explanation": explanation["detailed_explanation"],
                    "explanation_status": explanation["status"],
                },
                timestamp=event.timestamp,
            )
        )

    def _publish_event(self, event: dict) -> None:
        try:
            if self._event_callback:
                self._event_callback(event)
        except Exception as e:
            logger.error("Failed to publish cycle pipeline event", exc_info=e)

    def _explain_anomaly(
        self,
        event: SnapshotEvent,
        reason: str,
        similarity: float,
        anchor_id: Optional[int] = None,
    ) -> dict:
        fallback = {
            "short_reason": reason,
            "detailed_explanation": None,
            "status": "failed",
        }

        try:
            image_buffer = self._frame_to_jpeg(event.frame)
            if not image_buffer:
                fallback["status"] = "missing_image"
                return fallback

            anchor_descriptions = self._load_anchor_descriptions(event.camera_id)
            if not anchor_descriptions:
                fallback["status"] = "missing_anchor_descriptions"
                return fallback

            static_prompt, dynamic_prompt = self._build_anomaly_explanation_prompt(
                camera_id=event.camera_id,
                reason=reason,
                similarity=similarity,
                anchor_id=anchor_id,
                anchor_descriptions=anchor_descriptions,
            )

            analysis = self._vlm.analyze_image(
                image_url=None,
                image_buffer=image_buffer,
                static_prompt=static_prompt,
                dynamic_prompt=dynamic_prompt,
                model=settings.VLM_MODEL,
                metadata={
                    "camera_id": event.camera_id,
                    "anchor_id": anchor_id,
                    "timestamp": event.timestamp,
                    "technical_reason": reason,
                    "purpose": "cycle_anomaly_explanation",
                },
            )

            short_reason = analysis.get("frame_description", "").strip()
            detailed_explanation = analysis.get("rolling_context", "").strip()
            if not short_reason:
                return fallback

            return {
                "short_reason": short_reason,
                "detailed_explanation": detailed_explanation or None,
                "status": "completed",
            }

        except Exception as e:
            logger.error(
                f"Failed to explain anomaly | "
                f"camera={event.camera_id} anchor_id={anchor_id}",
                exc_info=e,
            )
            return fallback

    def _build_anomaly_explanation_prompt(
        self,
        *,
        camera_id: str,
        reason: str,
        similarity: float,
        anchor_id: Optional[int],
        anchor_descriptions: str,
    ):
        anomaly_prompt = self._read_text_file(
            ANOMALY_EXPLANATION_PROMPT_PATH,
            fallback=(
                "Compare the current image against the normal anchor "
                "descriptions and explain the visible anomaly."
            ),
        )
        anomaly_prompt = self._strip_markdown_code_fence(anomaly_prompt)
        anomaly_prompt = anomaly_prompt.replace(
            "{{ANCHOR_DESCRIPTIONS}}",
            anchor_descriptions,
        )

        static_prompt = """
            You are generating a machine-readable anomaly report.

            CRITICAL:
            Your response will be parsed automatically by software.

            You MUST follow the exact output structure defined in the user prompt.

            ADDITIONAL REQUIRED RULES:
            - You MUST include a section named FRAME_DESCRIPTION.
            - You MUST include a section named ROLLING_CONTEXT.
            - The section names are case-sensitive.
            - Do NOT use Markdown.
            - Do NOT wrap the response in code blocks.

            FORMAT REQUIREMENTS:

            FRAME_DESCRIPTION:
            A single short factual sentence summarizing the anomaly.

            ROLLING_CONTEXT:
            A detailed anomaly analysis using the structure and fields requested in the user prompt.

            The detailed analysis inside ROLLING_CONTEXT may contain:
            - CLOSEST_ANCHOR_MATCH
            - VISUAL_DIFFERENCE_SUMMARY
            - ANOMALY_TYPE
            - ANOMALY_REGION
            - ANOMALY_DESCRIPTION
            - SEVERITY
            - CONFIDENCE

            The response MUST begin with FRAME_DESCRIPTION.
            """.strip()

        dynamic_prompt = f"""
            Camera ID: {camera_id}
            Technical anomaly reason: {reason}
            Similarity score: {similarity:.4f}
            Matched anchor ID, if any: {anchor_id}

            {anomaly_prompt}
            """.strip()

        return static_prompt, dynamic_prompt

    def _load_anchor_descriptions(self, camera_id: str) -> str:
        camera_prompt_dir = os.path.join(PROMPTS_DIR, camera_id)
        if not os.path.isdir(camera_prompt_dir):
            return ""

        anchor_files = []
        for filename in os.listdir(camera_prompt_dir):
            match = re.fullmatch(r"anchor_(\d+)\.txt", filename)
            if match:
                anchor_files.append((int(match.group(1)), filename))

        anchor_files.sort(key=lambda item: item[0])

        sections = []
        for anchor_number, filename in anchor_files:
            path = os.path.join(camera_prompt_dir, filename)
            description = self._read_text_file(path)
            if not description:
                continue

            sections.append(
                f"ANCHOR {anchor_number}:\n{description.strip()}"
            )

        return "\n\n".join(sections)

    def _ensure_anchor_description(
        self,
        event: SnapshotEvent,
        anchor_id,
    ) -> None:
        try:
            if anchor_id is None:
                return

            description_path = self._get_anchor_description_path(
                camera_id=event.camera_id,
                anchor_id=anchor_id,
            )

            if os.path.exists(description_path):
                return

            image_buffer = self._frame_to_jpeg(event.frame)
            if not image_buffer:
                return

            static_prompt, dynamic_prompt = self._build_anchor_description_prompt(
                camera_id=event.camera_id,
                anchor_id=anchor_id,
            )

            analysis = self._vlm.analyze_image(
                image_url=None,
                image_buffer=image_buffer,
                static_prompt=static_prompt,
                dynamic_prompt=dynamic_prompt,
                model=settings.VLM_MODEL,
                metadata={
                    "camera_id": event.camera_id,
                    "anchor_id": anchor_id,
                    "timestamp": event.timestamp,
                    "purpose": "cycle_anchor_description",
                },
            )

            description = analysis.get("frame_description", "").strip()
            if not description:
                return

            self._write_anchor_description(description_path, description)
            logger.log(
                f"Anchor description created | "
                f"camera={event.camera_id} anchor_id={anchor_id}"
            )

        except Exception as e:
            logger.error(
                f"Failed to ensure anchor description | "
                f"camera={event.camera_id} anchor_id={anchor_id}",
                exc_info=e,
            )

    def _get_anchor_description_path(self, camera_id: str, anchor_id) -> str:
        camera_prompt_dir = os.path.join(PROMPTS_DIR, camera_id)
        os.makedirs(camera_prompt_dir, exist_ok=True)
        return os.path.join(camera_prompt_dir, f"anchor_{anchor_id}.txt")

    def _build_anchor_description_prompt(self, camera_id: str, anchor_id):
        scene_context = self._read_text_file(
            ANCHOR_SCENE_CONTEXT_PROMPT_PATH,
            fallback=(
                "This is a fixed camera scene. Describe the normal visual "
                "state represented by the matched anchor."
            ),
        )

        static_prompt = """
            You are an AI visual analyst generating compact visual anchor descriptions.

            Your task:
            - Describe only the visually important normal state.
            - Focus on spatial structure, object positions, operational state, and visible relationships.
            - Avoid generic environmental details unless visually important.
            - Avoid repetition from the scene context.
            - Avoid speculation.
            - Use concise factual language.
            - The output will later be used for anomaly comparison.

            You MUST produce exactly TWO sections, in this exact order:

            FRAME_DESCRIPTION:
            A concise description of the specific visual state visible in this frame.

            ROLLING_CONTEXT:
            A short reusable summary describing the stable visual characteristics of this anchor state.

            Rules:
            - Keep both sections compact.
            - Prefer operationally meaningful details over generic scene descriptions.
            - Do NOT mention image quality, lighting quality, or cleanliness unless visually relevant.
            - Do NOT add Markdown.
            - Do NOT add text outside the required sections.
            """.strip()

        dynamic_prompt = f"""
            Scene context:
            {scene_context}

            Camera ID: {camera_id}
            Anchor ID: {anchor_id}

            Create a textual description for this visual anchor from the provided image.
            """.strip()

        return static_prompt, dynamic_prompt

    @staticmethod
    def _read_text_file(path: str, fallback: str = "") -> str:
        try:
            with open(path, "r", encoding="utf-8") as file:
                return file.read().strip()
        except FileNotFoundError:
            return fallback

    @staticmethod
    def _strip_markdown_code_fence(text: str) -> str:
        stripped = text.strip()
        match = re.fullmatch(
            r"```(?:[^\n]*)\n(?P<body>.*)\n```",
            stripped,
            re.DOTALL,
        )
        if match:
            return match.group("body").strip()
        return stripped

    @staticmethod
    def _write_anchor_description(path: str, description: str) -> None:
        temp_path = f"{path}.tmp"
        with open(temp_path, "w", encoding="utf-8") as file:
            file.write(description.strip())
            file.write("\n")
        os.replace(temp_path, path)

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
