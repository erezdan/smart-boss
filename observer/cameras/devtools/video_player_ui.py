import cv2

from PySide6.QtWidgets import (
    QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout
)
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtCore import Qt, QTimer

from utils.logger import logger


class VideoPlayerUI(QWidget):
    """
    Dev-only UI that observes a VideoFileCamera.
    Uses QTimer (GUI thread safe).
    """

    def __init__(self, camera, window_title=None):
        super().__init__()

        self.camera = camera

        self._setup_ui(window_title or camera.video_path)

        self.timer = QTimer(self)
        self.timer.timeout.connect(self._on_timer)
        self.timer.start(30)

        logger.log("VideoPlayerUI started")

    def _setup_ui(self, title):
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

    def _on_timer(self):
        frame = self.camera.get_snapshot()
        if frame is None:
            return

        if self.video_label.text() == "Paused":
            self.video_label.setText("")

        self._update_ui(frame)

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
