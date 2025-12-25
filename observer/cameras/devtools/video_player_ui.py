import cv2
import threading
import time
from PySide6.QtWidgets import (
    QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout
)
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtCore import Qt
from utils.logger import logger

class VideoPlayerUI(QWidget):
    """
    Dev-only video player UI.
    Plays a local video file and exposes the last decoded frame.
    """

    def __init__(self, video_path: str, window_title: str | None = None):
        super().__init__()

        self.video_path = video_path
        self.cap = cv2.VideoCapture(video_path)

        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open video file: {video_path}")
            logger.error(f"Failed to open video file: {video_path}")

        self.last_frame = None
        self.is_playing = False
        self._stop_event = threading.Event()
        self._thread = None

        self._init_ui(window_title or video_path)

    def _init_ui(self, title: str):
        self.setWindowTitle(title)
        self.setWindowFlags(Qt.Window)
        self.resize(360, 240)

        self.video_label = QLabel("Paused")
        self.video_label.setAlignment(Qt.AlignCenter)

        self.play_button = QPushButton("Play")
        self.pause_button = QPushButton("Pause")

        self.play_button.clicked.connect(self.play)
        self.pause_button.clicked.connect(self.pause)

        controls = QHBoxLayout()
        controls.addWidget(self.play_button)
        controls.addWidget(self.pause_button)

        layout = QVBoxLayout()
        layout.addWidget(self.video_label)
        layout.addLayout(controls)

        self.setLayout(layout)

    def play(self):
        if self.is_playing:
            return

        self.is_playing = True
        self._stop_event.clear()

        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(target=self._play_loop, daemon=True)
            self._thread.start()

    def pause(self):
        self.is_playing = False

    def stop(self):
        self.is_playing = False
        self._stop_event.set()

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)

        self.cap.release()

    def _play_loop(self):
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        delay = 1.0 / fps if fps > 0 else 0.04

        while not self._stop_event.is_set():
            if not self.is_playing:
                time.sleep(0.05)
                continue

            ret, frame = self.cap.read()

            if not ret:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            self.last_frame = frame
            self._update_ui(frame)

            time.sleep(delay)

    def _update_ui(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb.shape
        bytes_per_line = ch * w

        qimg = QImage(rgb.data, w, h, bytes_per_line, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(qimg).scaled(
            self.video_label.width(),
            self.video_label.height(),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation,
        )

        self.video_label.setPixmap(pixmap)

    def get_last_frame(self):
        """
        Returns the last decoded frame (BGR / OpenCV format).
        """
        return self.last_frame
