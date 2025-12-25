import cv2
import threading
import time
from utils.logger import logger


class VideoFileCamera:
    """
    Camera source that reads frames from a local video file.
    Designed for long-running, fault-tolerant operation.
    Must never crash the application.
    """

    def __init__(self, video_path: str, loop: bool = True, start_paused: bool = True):
        self.video_path = video_path
        self.loop = loop
        self._paused = start_paused

        self._cap = None
        self._last_frame = None
        self._running = False

        self._lock = threading.Lock()
        self._thread = None

    def start(self):
        if self._running:
            return

        logger.log(f"Starting VideoFileCamera ({self.video_path})")

        try:
            self._cap = cv2.VideoCapture(self.video_path)
            if not self._cap.isOpened():
                raise RuntimeError(f"Failed to open video file: {self.video_path}")
        except Exception as e:
            # Fatal for this camera source
            logger.error("Failed to initialize VideoFileCamera", exc_info=e)
            self._cap = None
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._read_loop,
            name=f"VideoFileCamera-{self.video_path}",
            daemon=True,
        )
        self._thread.start()

    def stop(self):
        if not self._running:
            return

        logger.log("Stopping VideoFileCamera")

        self._running = False

        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None

        if self._cap:
            try:
                self._cap.release()
            except Exception as e:
                # Non-fatal: release failures should not propagate
                logger.error("Error while releasing VideoCapture", exc_info=e)
            self._cap = None

        logger.log("VideoFileCamera stopped")

    def play(self):
        with self._lock:
            self._paused = False

    def pause(self):
        with self._lock:
            self._paused = True

    def get_snapshot(self):
        with self._lock:
            return self._last_frame

    def _read_loop(self):
        """
        Internal frame reading loop.
        Runs in a background thread and must never raise.
        """
        try:
            fps = 0.0
            try:
                fps = self._cap.get(cv2.CAP_PROP_FPS)
            except Exception:
                fps = 0.0

            delay = 1.0 / fps if fps and fps > 0 else 0.04

            logger.log(
                f"VideoFileCamera read loop started "
                f"(fps={fps if fps else 'unknown'})"
            )

            while self._running:
                with self._lock:
                    paused = self._paused

                if paused:
                    time.sleep(0.05)
                    continue

                try:
                    ret, frame = self._cap.read()
                except Exception as e:
                    # VideoCapture read failure: wait and retry
                    logger.error("Error reading frame from video file", exc_info=e)
                    time.sleep(delay)
                    continue

                if not ret or frame is None:
                    if self.loop:
                        try:
                            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        except Exception as e:
                            logger.error(
                                "Failed to rewind video file",
                                exc_info=e,
                            )
                            time.sleep(delay)
                        continue
                    else:
                        # End of video reached, pause silently
                        with self._lock:
                            self._paused = True
                        time.sleep(delay)
                        continue

                with self._lock:
                    self._last_frame = frame

                time.sleep(delay)

        except Exception as e:
            # Absolute safety net: thread must never die silently
            logger.error(
                "Fatal error in VideoFileCamera read loop",
                exc_info=e,
            )
        finally:
            logger.log("VideoFileCamera read loop stopped")
