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
    Must never crash the application.
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
        self._lock = threading.Lock()

    def start(self):
        with self._lock:
            if self._running:
                return

            logger.log(f"Starting CameraClient '{self.camera_id}'")

            self._running = True

            try:
                self.camera_source.start()
                self.camera_source.play()
            except Exception as e:
                # Fatal for this camera: cannot run without a valid source
                logger.error(
                    f"Failed to start camera source for '{self.camera_id}'",
                    exc_info=e,
                )
                self._running = False
                return

            self._thread = threading.Thread(
                target=self._snapshot_loop,
                name=f"CameraClient-{self.camera_id}",
                daemon=True,
            )
            self._thread.start()

    def stop(self):
        with self._lock:
            if not self._running:
                return

            logger.log(f"Stopping CameraClient '{self.camera_id}'")
            self._running = False

            try:
                self.camera_source.stop()
            except Exception as e:
                # Non-fatal: shutdown must continue
                logger.error(
                    f"Error while stopping camera source for '{self.camera_id}'",
                    exc_info=e,
                )

        if self._thread:
            self._thread.join(timeout=2.0)

    def _snapshot_loop(self):
        """
        Internal snapshot loop.
        This method runs in a background thread and must never raise.
        """
        try:
            policy_mode = self.snapshot_policy.get("mode", "interval")

            if policy_mode != "interval":
                logger.error(
                    f"Unsupported snapshot policy '{policy_mode}' "
                    f"for camera '{self.camera_id}'"
                )
                return

            interval = self.snapshot_policy.get("interval_seconds", 2)
            resize_percent = self.snapshot_policy.get("resize_percent", 100)

            logger.log(
                f"CameraClient '{self.camera_id}' snapshot loop started "
                f"(interval={interval}s, resize={resize_percent}%)"
            )

            while self._running:
                try:
                    frame = self.camera_source.get_snapshot()
                except Exception as e:
                    # Camera source failure: wait and retry
                    logger.error(
                        f"Error retrieving frame from camera '{self.camera_id}'",
                        exc_info=e,
                    )
                    time.sleep(interval)
                    continue

                if frame is None:
                    # Avoid log flooding on missing frames
                    time.sleep(interval)
                    continue

                processed_frame = frame

                if resize_percent < 100:
                    try:
                        height, width = frame.shape[:2]
                        new_width = int(width * resize_percent / 100)
                        new_height = int(height * resize_percent / 100)

                        processed_frame = cv2.resize(
                            frame,
                            (new_width, new_height),
                            interpolation=cv2.INTER_AREA,
                        )
                    except Exception as e:
                        # Skip this frame if resizing fails
                        logger.error(
                            f"Failed to resize frame for camera '{self.camera_id}'",
                            exc_info=e,
                        )
                        time.sleep(interval)
                        continue

                event = SnapshotEvent(
                    camera_id=self.camera_id,
                    frame=processed_frame,
                    timestamp=time.time(),
                )

                try:
                    self.on_snapshot(event)
                except Exception as e:
                    # Callback failures must never propagate
                    logger.error(
                        f"Snapshot callback failed for camera '{self.camera_id}'",
                        exc_info=e,
                    )

                time.sleep(interval)

        except Exception as e:
            # Absolute safety net: this thread must never crash silently
            logger.error(
                f"Fatal error in snapshot loop for camera '{self.camera_id}'",
                exc_info=e,
            )
        finally:
            logger.log(
                f"CameraClient '{self.camera_id}' snapshot loop stopped"
            )
