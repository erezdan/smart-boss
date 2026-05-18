from __future__ import annotations

import asyncio
import base64
import cv2
from time import time
from typing import Dict

from utils.logger import logger
from websocket.connection_manager import ConnectionManager
from websocket.schemas import StreamConfig, make_event


class FramePublisher:
    """
    Publishes latest camera frames to websocket clients at display FPS.

    It reads from CameraSource.get_snapshot(), encodes once per camera tick,
    and broadcasts the same message to subscribed clients.
    """

    def __init__(
        self,
        *,
        camera_manager,
        connection_manager: ConnectionManager,
        config: StreamConfig,
    ):
        self._camera_manager = camera_manager
        self._connections = connection_manager
        self._config = config
        self._tasks: Dict[str, asyncio.Task] = {}
        self._running = False

    def start(self) -> None:
        if self._running:
            return

        self._running = True
        for camera_id in self._camera_manager.get_camera_sources().keys():
            self._tasks[camera_id] = asyncio.create_task(
                self._publish_loop(camera_id),
                name=f"FramePublisher-{camera_id}",
            )
        logger.log(f"FramePublisher started | cameras={len(self._tasks)}")

    def stop(self) -> None:
        self._running = False
        for task in self._tasks.values():
            task.cancel()
        self._tasks.clear()
        logger.log("FramePublisher stopped")

    async def _publish_loop(self, camera_id: str) -> None:
        interval = 1.0 / max(self._config.default_display_fps, 0.1)

        logger.log(
            f"FramePublisher loop started | camera={camera_id} "
            f"fps={self._config.default_display_fps}"
        )

        while self._running:
            started = time()

            try:
                clients = await self._connections.clients_for(camera_id)
                if clients:
                    message = self._build_frame_message(camera_id)
                    if message:
                        stale = []
                        for client in clients:
                            ok = await client.send_json(message)
                            if not ok:
                                stale.append(client)

                        for client in stale:
                            await self._connections.remove(camera_id, client)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    f"FramePublisher iteration failed | camera={camera_id}",
                    exc_info=e,
                )

            elapsed = time() - started
            sleep_for = interval - elapsed
            if sleep_for > 0:
                await asyncio.sleep(sleep_for)
            else:
                await asyncio.sleep(0)

        logger.log(f"FramePublisher loop stopped | camera={camera_id}")

    def _build_frame_message(self, camera_id: str):
        try:
            camera_source = self._camera_manager.get_camera_source(camera_id)
            if camera_source is None:
                return None

            frame = camera_source.get_snapshot()
            if frame is None:
                return None

            encoded, width, height = self._encode_jpeg(frame)
            if not encoded:
                return None

            return make_event(
                "frame",
                camera_id,
                {
                    "encoding": "jpeg_base64",
                    "width": width,
                    "height": height,
                    "data": base64.b64encode(encoded).decode("ascii"),
                },
            )

        except Exception as e:
            logger.error(
                f"Failed to build websocket frame message | camera={camera_id}",
                exc_info=e,
            )
            return None

    def _encode_jpeg(self, frame):
        try:
            height, width = frame.shape[:2]

            if width > self._config.max_width:
                scale = self._config.max_width / float(width)
                new_size = (self._config.max_width, int(height * scale))
                frame = cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
                height, width = frame.shape[:2]

            success, buffer = cv2.imencode(
                ".jpg",
                frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), self._config.jpeg_quality],
            )
            if not success:
                return None, width, height

            return buffer.tobytes(), width, height

        except Exception as e:
            logger.error("Failed to encode websocket frame JPEG", exc_info=e)
            return None, 0, 0

