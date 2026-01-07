
import sys
print(sys.executable)

import cv2

from PySide6.QtWidgets import (
    QWidget, QLabel, QPushButton, QVBoxLayout, QHBoxLayout
)
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtCore import Qt, QTimer

from utils.logger import logger


class VideoPlayerUI(QWidget):
    """
    Dev-only UI that observes a camera source.
    Uses QTimer (GUI-thread safe).
    Must never crash the application.
    """

    def __init__(self, camera, window_title=None):
        super().__init__()

        self.camera = camera
        self._running = True

        try:
            self._setup_ui(window_title or getattr(camera, "video_path", "Camera"))
        except Exception as e:
            # Fatal for this UI only
            logger.error("Failed to setup VideoPlayerUI", exc_info=e)
            return

        self.timer = QTimer(self)
        self.timer.timeout.connect(self._on_timer)
        self.timer.start(30)

        logger.log("VideoPlayerUI started")

    def closeEvent(self, event):
        """
        Ensure timer is stopped cleanly when the window is closed.
        """
        try:
            self._running = False
            if self.timer:
                self.timer.stop()
        except Exception:
            pass

        event.accept()

    def _setup_ui(self, title):
        self.setWindowTitle(title)
        self.setWindowFlags(Qt.Window)
        self.resize(660, 410)

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
        self.pause()

    def play(self):
        try:
            self.camera.play()
        except Exception as e:
            # UI interaction must never propagate failures
            logger.error("Error while calling camera.play()", exc_info=e)

    def pause(self):
        try:
            self.camera.pause()
        except Exception as e:
            # UI interaction must never propagate failures
            logger.error("Error while calling camera.pause()", exc_info=e)

    def _on_timer(self):
        """
        QTimer callback.
        Must never raise exceptions.
        """
        if not self._running:
            return

        try:
            frame = self.camera.get_snapshot()
            if frame is None:
                return

            if self.video_label.text() == "Paused":
                self.video_label.setText("")

            self._update_ui(frame)

        except Exception as e:
            # Absolutely critical: GUI thread must not crash
            logger.error("Unhandled error in VideoPlayerUI timer", exc_info=e)

    def _update_ui(self, frame):
        """
        Update QLabel with a video frame.
        Must be extremely defensive.
        """
        try:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb.shape
            bytes_per_line = ch * w

            qimg = QImage(
                rgb.data,
                w,
                h,
                bytes_per_line,
                QImage.Format_RGB888,
            )

            pixmap = QPixmap.fromImage(qimg).scaled(
                self.video_label.width(),
                self.video_label.height(),
                Qt.KeepAspectRatio,
                Qt.SmoothTransformation,
            )

            self.video_label.setPixmap(pixmap)

        except Exception as e:
            # Skip frame silently on rendering errors
            logger.error("Failed to render frame in VideoPlayerUI", exc_info=e)
