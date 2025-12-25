import signal
import sys
import time
from utils.logger import logger
from cameras.camera_manager import CameraManager

class Supervisor:
    """
    Top-level application supervisor.
    Responsible for starting and stopping all subsystems.
    """

    def __init__(self, cameras_config_path: str):
        self.cameras_config_path = cameras_config_path
        self.camera_manager = None
        self._running = False

    def start(self):
        logger.log("Supervisor starting")

        self.camera_manager = CameraManager(
            config_path=self.cameras_config_path,
            on_camera_snapshot=self.on_camera_snapshot,
        )
        self.camera_manager.load()
        self.camera_manager.start()
        self.qt_app = self.camera_manager._qt_app

        self._running = True
        logger.log("Supervisor started")

    def stop(self):
        if not self._running:
            return

        logger.log("Supervisor stopping")

        if self.camera_manager:
            self.camera_manager.stop()

        self._running = False
        logger.log("Supervisor stopped")

    def on_camera_snapshot(self, snapshot_event):
        """
        Entry point for all camera snapshots.
        For now: simple logging for validation.
        """
        logger.log(
            f"Snapshot received | camera={snapshot_event.camera_id} "
            f"time={snapshot_event.timestamp}"
        )

    def run_forever(self):
        def handle_signal(signum, frame):
            logger.log(f"Signal {signum} received")
            self.stop()
            sys.exit(0)

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        logger.log("Supervisor running (Ctrl+C to stop)")

        while True:
            time.sleep(1)
