import json
from typing import Callable, Dict

from cameras.camera_client import CameraClient
from cameras.camera_sources.video_file_camera import VideoFileCamera
from cameras.devtools.video_player_ui import VideoPlayerUI

from utils.logger import logger


class CameraManager:
    """
    Responsible for loading camera configuration,
    creating camera clients, and managing lifecycle.
    """

    def __init__(self, config_path: str, on_camera_snapshot: Callable):
        self.config_path = config_path
        self.on_camera_snapshot = on_camera_snapshot

        self._camera_clients: Dict[str, CameraClient] = {}

    def load(self):
        logger.log(f"Loading camera configuration from {self.config_path}")

        with open(self.config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        cameras = config.get("cameras", [])

        for cam_cfg in cameras:
            if not cam_cfg.get("enabled", False):
                continue

            camera_id = cam_cfg["camera_id"]
            camera_type = cam_cfg["type"]

            logger.log(f"Initializing camera '{camera_id}' of type '{camera_type}'")

            camera_source = self._create_camera_source(cam_cfg)

            # DEV UI handling
            dev_cfg = cam_cfg.get("dev", {})
            ui_enabled = dev_cfg.get("ui_enabled", False)

            if ui_enabled:
                logger.log(f"Starting VideoPlayerUI for camera {camera_id}")
                VideoPlayerUI(
                    camera=camera_source,
                    window_title=cam_cfg.get("name", camera_id),
                )

            client = CameraClient(
                camera_id=camera_id,
                camera_source=camera_source,
                snapshot_policy=cam_cfg.get("snapshot_policy", {}),
                on_snapshot=self.on_camera_snapshot,
            )

            self._camera_clients[camera_id] = client

        logger.log(f"CameraManager initialized with {len(self._camera_clients)} cameras")

    def start(self):
        """
        Start all camera clients.
        """
        logger.log("Starting all camera clients")

        for client in self._camera_clients.values():
            client.start()

    def stop(self):
        """
        Stop all camera clients.
        """
        logger.log("Stopping all camera clients")

        for client in self._camera_clients.values():
            client.stop()

    def _create_camera_source(self, cam_cfg):
        """
        Factory method for creating camera source objects.
        """
        cam_type = cam_cfg["type"]
        source_cfg = cam_cfg.get("source", {})

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
