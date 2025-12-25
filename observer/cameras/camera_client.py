import threading
import time
import cv2
from typing import Callable, Dict

from utils.logger import logger
from cameras.camera_events import SnapshotEvent


class CameraClient:
    """
    Runtime consumer of a single camera source.
    Responsible for snapshot loop and policy handling.
    """

    def __init__(
        self,
        camera_id: str,
        camera_source,
        snapshot_policy: Dict,
        on_snapshot: Callable,
    ):
        self.camera_id = camera_id
        self.camera_source = camera_source
        self.snapshot_policy = snapshot_policy
        self.on_snapshot = on_snapshot

        self._running = False
        self._thread = None

    def start(self):
        if self._running:
            return

        logger.log(f"Starting CameraClient {self.camera_id}")

        self._running = True
        self.camera_source.start()
        self.camera_source.play()

        self._thread = threading.Thread(
            target=self._snapshot_loop, daemon=True
        )
        self._thread.start()

    def stop(self):
        if not self._running:
            return

        logger.log(f"Stopping CameraClient {self.camera_id}")

        self._running = False
        self.camera_source.stop()

        if self._thread:
            self._thread.join(timeout=1.0)

    def _snapshot_loop(self):
        policy_mode = self.snapshot_policy.get("mode", "interval")

        if policy_mode != "interval":
            logger.warning(
                f"Unsupported snapshot policy '{policy_mode}' "
                f"for camera {self.camera_id}"
            )
            return

        interval = self.snapshot_policy.get("interval_seconds", 2)

        logger.log(
            f"CameraClient {self.camera_id} snapshot loop started "
            f"(interval={interval}s)"
        )

        resize_percent = self.snapshot_policy.get("resize_percent", 50)
        
        while self._running:
            frame = self.camera_source.get_snapshot()

            if frame is not None:
                resized_frame = frame

                if resize_percent < 100:
                    height, width = frame.shape[:2]
                    new_width = int(width * resize_percent / 100)
                    new_height = int(height * resize_percent / 100)

                    resized_frame = cv2.resize(
                        frame,
                        (new_width, new_height),
                        interpolation=cv2.INTER_AREA
                    )

                event = SnapshotEvent(
                    camera_id=self.camera_id,
                    frame=resized_frame,
                    timestamp=time.time(),
                )
                self.on_snapshot(event)
            else:
                logger.warning(
                    f"No frame available for camera {self.camera_id}"
                )

            time.sleep(interval)
