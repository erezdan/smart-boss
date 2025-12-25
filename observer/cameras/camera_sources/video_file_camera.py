import cv2
import threading
import time
from utils.logger import logger


class VideoFileCamera:
    """
    Camera source that reads frames from a local video file.
    Can run headless or be observed by a UI.
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

        self._cap = cv2.VideoCapture(self.video_path)
        if not self._cap.isOpened():
            logger.error(f"Failed to open video file: {self.video_path}")
            return

        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()

        logger.log("VideoFileCamera read thread started")

    def stop(self):
        self._running = False

        if self._thread:
            self._thread.join(timeout=1.0)

        if self._cap:
            self._cap.release()
            self._cap = None

        logger.log("VideoFileCamera stopped")

    def play(self):
        self._paused = False
        logger.log("VideoFileCamera play")

    def pause(self):
        self._paused = True
        logger.log("VideoFileCamera pause")

    def get_snapshot(self):
        with self._lock:
            return self._last_frame

    def _read_loop(self):
        fps = self._cap.get(cv2.CAP_PROP_FPS)
        delay = 1.0 / fps if fps and fps > 0 else 0.04

        logger.log(f"VideoFileCamera read loop started (fps={fps})")

        while self._running:
            if self._paused:
                time.sleep(0.05)
                continue

            ret, frame = self._cap.read()

            if not ret:
                if self.loop:
                    self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    self._paused = True
                    continue

            with self._lock:
                self._last_frame = frame

            time.sleep(delay)
