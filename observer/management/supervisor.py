import signal
import sys
import time
from utils.logger import logger
from cameras.camera_manager import CameraManager


class Supervisor:
    """
    Top-level application supervisor.
    Responsible for starting, running, and stopping all subsystems.
    Must never crash.
    """

    def __init__(self, cameras_config_path: str):
        self.cameras_config_path = cameras_config_path
        self.camera_manager = None
        self.qt_app = None
        self._running = False

    def start(self):
        logger.log("Supervisor starting")

        try:
            self.camera_manager = CameraManager(
                config_path=self.cameras_config_path,
                on_camera_snapshot=self.on_camera_snapshot,
            )

            self.camera_manager.load()
            self.camera_manager.start()
            self.qt_app = self.camera_manager._qt_app

            self._running = True
            logger.log("Supervisor started")

        except Exception as e:
            # Fatal: application cannot continue without CameraManager
            logger.error("Supervisor failed to start", exc_info=e)
            self._running = False
            raise

    def stop(self):
        if not self._running:
            return

        logger.log("Supervisor stopping")

        try:
            if self.camera_manager:
                self.camera_manager.stop()
        except Exception as e:
            # Non-fatal: shutdown must continue even if a subsystem fails
            logger.error("Error while stopping CameraManager", exc_info=e)

        self._running = False
        logger.log("Supervisor stopped")

    def on_camera_snapshot(self, snapshot_event):
        """
        Entry point for all camera snapshot events.
        This callback must never raise exceptions.
        """
        try:
            # Do NOT add verbose logging here.
            # Snapshot events may occur very frequently and can flood logs.
            pass
        except Exception as e:
            # Safety net: never allow callback failures to propagate
            logger.error("Unhandled error in on_camera_snapshot", exc_info=e)

    def run_forever(self):
        def handle_signal(signum, frame):
            logger.log(f"Signal {signum} received")
            self.stop()

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        logger.log("Supervisor running")

        self._running = True

        while self._running:
            try:
                time.sleep(1)
            except Exception as e:
                # Extremely defensive: nothing should ever break this loop
                logger.error(
                    "Unexpected error in Supervisor main loop",
                    exc_info=e
                )
