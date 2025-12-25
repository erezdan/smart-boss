import sys
import json
from typing import Callable, Dict

from cameras.camera_client import CameraClient
from cameras.camera_sources.video_file_camera import VideoFileCamera
from cameras.devtools.video_player_ui import VideoPlayerUI
from PySide6.QtWidgets import QApplication

from utils.logger import logger


class CameraManager:
    """
    Responsible for loading camera configuration,
    creating camera clients, and managing lifecycle.
    Must be resilient and never crash the application.
    """

    def __init__(self, config_path: str, on_camera_snapshot: Callable):
        self.config_path = config_path
        self.on_camera_snapshot = on_camera_snapshot

        self._camera_clients: Dict[str, CameraClient] = {}
        self._camera_sources: Dict[str, object] = {}
        self._camera_configs = []

        self._qt_app = None
        self._ui_players = []

    def load(self):
        logger.log(f"Loading camera configuration from {self.config_path}")

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception as e:
            # Fatal: cannot operate without valid configuration
            logger.error("Failed to load camera configuration file", exc_info=e)
            raise

        self._camera_configs = config.get("cameras", [])

        for cam_cfg in self._camera_configs:
            try:
                if not cam_cfg.get("enabled", False):
                    continue

                camera_id = cam_cfg["camera_id"]
                camera_type = cam_cfg["type"]

                logger.log(
                    f"Initializing camera '{camera_id}' of type '{camera_type}'"
                )

                camera_source = self._create_camera_source(cam_cfg)
                self._camera_sources[camera_id] = camera_source

                client = CameraClient(
                    camera_id=camera_id,
                    camera_source=camera_source,
                    snapshot_policy=cam_cfg.get("snapshot_policy", {}),
                    on_snapshot=self._safe_snapshot_callback,
                )

                self._camera_clients[camera_id] = client

            except Exception as e:
                # Non-fatal: one camera must not break the entire system
                logger.error(
                    f"Failed to initialize camera '{cam_cfg.get('camera_id', 'unknown')}'",
                    exc_info=e,
                )

        logger.log(
            f"CameraManager initialized with {len(self._camera_clients)} active cameras"
        )

    def start(self):
        """
        Start all camera clients and optional dev UIs.
        """
        logger.log("Starting all camera clients")

        for camera_id, client in self._camera_clients.items():
            try:
                client.start()
            except Exception as e:
                # Non-fatal: other cameras must continue running
                logger.error(
                    f"Failed to start CameraClient '{camera_id}'",
                    exc_info=e,
                )

        # Development UI (VideoPlayer) is optional and isolated
        for cam_cfg in self._camera_configs:
            try:
                dev_cfg = cam_cfg.get("dev", {})
                if not dev_cfg.get("ui_enabled", False):
                    continue

                camera_id = cam_cfg["camera_id"]
                camera_source = self._camera_sources.get(camera_id)

                if not camera_source:
                    continue

                logger.log(f"Starting VideoPlayerUI for camera '{camera_id}'")

                if QApplication.instance() is None:
                    self._qt_app = QApplication(sys.argv)

                player = VideoPlayerUI(
                    camera=camera_source,
                    window_title=cam_cfg.get("name", camera_id),
                )
                player.show()
                self._ui_players.append(player)

            except Exception as e:
                # Dev UI must never affect production flow
                logger.error(
                    f"Failed to start VideoPlayerUI for camera '{cam_cfg.get('camera_id')}'",
                    exc_info=e,
                )

    def stop(self):
        """
        Stop all camera clients gracefully.
        """
        logger.log("Stopping all camera clients")

        for camera_id, client in self._camera_clients.items():
            try:
                client.stop()
            except Exception as e:
                # Non-fatal: continue shutdown sequence
                logger.error(
                    f"Error while stopping CameraClient '{camera_id}'",
                    exc_info=e,
                )

    def _safe_snapshot_callback(self, snapshot_event):
        """
        Internal safety wrapper for snapshot callbacks.
        Must never raise exceptions.
        """
        try:
            self.on_camera_snapshot(snapshot_event)
        except Exception as e:
            # Snapshot callbacks must never propagate failures
            logger.error(
                "Unhandled error in camera snapshot callback",
                exc_info=e,
            )

    def _create_camera_source(self, cam_cfg):
        """
        Factory method for creating camera source objects.
        """
        cam_type = cam_cfg.get("type")
        source_cfg = cam_cfg.get("source", {})

        try:
            if cam_type == "video_file":
                video_path = source_cfg["video_path"]
                loop = source_cfg.get("loop", True)
                start_paused = source_cfg.get("start_paused", True)

                logger.log(f"Creating VideoFileCamera for {video_path}")

                return VideoFileCamera(
                    video_path=video_path,
                    loop=loop,
                    start_paused=start_paused,
                )

            raise ValueError(f"Unsupported camera type: {cam_type}")

        except Exception as e:
            # Fatal per camera, handled by caller
            logger.error(
                f"Failed to create camera source for type '{cam_type}'",
                exc_info=e,
            )
            raise
