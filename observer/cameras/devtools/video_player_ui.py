import threading
import time
import cv2

from PySide6.QtWidgets import (
    QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout
)
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtCore import Qt

from utils.logger import logger


class VideoPlayerUI(QWidget):
    """
    Dev-only UI that observes a VideoFileCamera.
    Does NOT read video by itself.
    """

    def __init__(self, camera, window_title: str | None = None):
        super().__init__()

        self.camera = camera
        self._stop_event = threading.Event()

        self._init_ui(window_title or camera.video_path)

        self._thread = threading.Thread(target=self._ui_loop, daemon=True)
        self._thread.start()

        logger.log("VideoPlayerUI started")

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
        self.camera.play()

    def pause(self):
        self.camera.pause()

    def closeEvent(self, event):
        self._stop_event.set()
        event.accept()

    def _ui_loop(self):
        while not self._stop_event.is_set():
            frame = self.camera.get_snapshot()

            if frame is not None:
                self._update_ui(frame)

            time.sleep(0.03)

    def _update_ui(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb.shape
        bytes_per_line = ch * w

        qimg = QImage(
            rgb.data,
            w,
            h,
            bytes_per_line,
            QImage.Format_RGB888
        )

        pixmap = QPixmap.fromImage(qimg).scaled(
            self.video_label.width(),
            self.video_label.height(),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation,
        )

        self.video_label.setPixmap(pixmap)
