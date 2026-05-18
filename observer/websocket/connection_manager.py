from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import DefaultDict, Dict, Set

from utils.logger import logger


class ConnectionManager:
    """
    Tracks websocket clients by camera_id.

    The current product assumption is a single UI client, but the data
    structure supports more than one client to keep the server resilient.
    """

    def __init__(self):
        self._clients_by_camera: DefaultDict[str, Set[object]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def add(self, camera_id: str, client: object) -> None:
        try:
            async with self._lock:
                self._clients_by_camera[camera_id].add(client)
            logger.log(f"WebSocket client connected | camera={camera_id}")
        except Exception as e:
            logger.error("Failed to register WebSocket client", exc_info=e)

    async def remove(self, camera_id: str, client: object) -> None:
        try:
            async with self._lock:
                clients = self._clients_by_camera.get(camera_id)
                if clients:
                    clients.discard(client)
                    if not clients:
                        self._clients_by_camera.pop(camera_id, None)
            logger.log(f"WebSocket client disconnected | camera={camera_id}")
        except Exception as e:
            logger.error("Failed to unregister WebSocket client", exc_info=e)

    async def snapshot(self) -> Dict[str, Set[object]]:
        try:
            async with self._lock:
                return {
                    camera_id: set(clients)
                    for camera_id, clients in self._clients_by_camera.items()
                }
        except Exception as e:
            logger.error("Failed to snapshot WebSocket clients", exc_info=e)
            return {}

    async def clients_for(self, camera_id: str) -> Set[object]:
        try:
            async with self._lock:
                return set(self._clients_by_camera.get(camera_id, set()))
        except Exception as e:
            logger.error("Failed to read WebSocket clients", exc_info=e)
            return set()

