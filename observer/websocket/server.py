from __future__ import annotations

import asyncio
import base64
import hashlib
import json
import re
import struct
from typing import Any, Dict, Optional

from utils.logger import logger
from websocket.connection_manager import ConnectionManager
from websocket.frame_publisher import FramePublisher
from websocket.schemas import StreamConfig, make_event


_WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
_CAMERA_PATH_RE = re.compile(r"^/ws/cameras/([^/?#]+)$")


class WebSocketClient:
    def __init__(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.reader = reader
        self.writer = writer
        self._send_lock = asyncio.Lock()
        self.closed = False

    async def send_json(self, payload: Dict[str, Any]) -> bool:
        try:
            data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
            return await self.send_text_bytes(data)
        except Exception as e:
            logger.error("Failed to serialize WebSocket payload", exc_info=e)
            return False

    async def send_text_bytes(self, data: bytes) -> bool:
        if self.closed:
            return False

        try:
            frame = self._encode_server_frame(data, opcode=0x1)
            async with self._send_lock:
                self.writer.write(frame)
                await self.writer.drain()
            return True
        except Exception as e:
            self.closed = True
            logger.error("Failed to send WebSocket message", exc_info=e)
            return False

    async def send_close(self) -> None:
        if self.closed:
            return
        try:
            async with self._send_lock:
                self.writer.write(self._encode_server_frame(b"", opcode=0x8))
                await self.writer.drain()
        except Exception:
            pass
        finally:
            self.closed = True

    async def send_pong(self, data: bytes = b"") -> bool:
        if self.closed:
            return False

        try:
            frame = self._encode_server_frame(data, opcode=0xA)
            async with self._send_lock:
                self.writer.write(frame)
                await self.writer.drain()
            return True
        except Exception as e:
            self.closed = True
            logger.error("Failed to send WebSocket pong", exc_info=e)
            return False

    @staticmethod
    def _encode_server_frame(data: bytes, opcode: int) -> bytes:
        length = len(data)
        first = 0x80 | opcode

        if length < 126:
            header = bytes([first, length])
        elif length <= 0xFFFF:
            header = bytes([first, 126]) + struct.pack("!H", length)
        else:
            header = bytes([first, 127]) + struct.pack("!Q", length)

        return header + data


class WebSocketServer:
    """
    Minimal RFC6455 websocket server for local OBSERVER UI streaming.

    Endpoint:
      /ws/cameras/{camera_id}

    Message types sent to clients:
      - frame
      - prediction
      - anomaly
      - camera.status
    """

    def __init__(
        self,
        *,
        camera_manager,
        loop: asyncio.AbstractEventLoop,
        config: Optional[StreamConfig] = None,
    ):
        self._camera_manager = camera_manager
        self._loop = loop
        self._config = config or StreamConfig()
        self._connections = ConnectionManager()
        self._publisher = FramePublisher(
            camera_manager=camera_manager,
            connection_manager=self._connections,
            config=self._config,
        )
        self._server: Optional[asyncio.AbstractServer] = None
        self._started = False

    def start_threadsafe(self) -> None:
        try:
            future = asyncio.run_coroutine_threadsafe(self.start(), self._loop)
            future.result(timeout=10)
        except Exception as e:
            logger.error("Failed to start WebSocket server", exc_info=e)

    def stop_threadsafe(self) -> None:
        try:
            future = asyncio.run_coroutine_threadsafe(self.stop(), self._loop)
            future.result(timeout=10)
        except Exception as e:
            logger.error("Failed to stop WebSocket server", exc_info=e)

    async def start(self) -> None:
        if self._started:
            return

        try:
            self._server = await asyncio.start_server(
                self._handle_client,
                self._config.host,
                self._config.port,
            )
            self._publisher.start()
            self._started = True
            logger.log(
                "WebSocket server started | "
                f"ws://{self._config.host}:{self._config.port}/ws/cameras/<camera_id>"
            )
        except Exception as e:
            logger.error("WebSocket server startup failed", exc_info=e)

    async def stop(self) -> None:
        try:
            self._publisher.stop()

            if self._server:
                self._server.close()
                await self._server.wait_closed()
                self._server = None

            self._started = False
            logger.log("WebSocket server stopped")
        except Exception as e:
            logger.error("WebSocket server shutdown failed", exc_info=e)

    def publish_event_threadsafe(self, event: Dict[str, Any]) -> None:
        try:
            asyncio.run_coroutine_threadsafe(self.publish_event(event), self._loop)
        except Exception as e:
            logger.error("Failed to schedule WebSocket event publish", exc_info=e)

    async def publish_event(self, event: Dict[str, Any]) -> None:
        try:
            camera_id = event.get("camera_id")
            if not camera_id:
                return

            clients = await self._connections.clients_for(camera_id)
            stale = []

            for client in clients:
                ok = await client.send_json(event)
                if not ok:
                    stale.append(client)

            for client in stale:
                await self._connections.remove(camera_id, client)

        except Exception as e:
            logger.error("Failed to publish WebSocket event", exc_info=e)

    async def _handle_client(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        client = WebSocketClient(reader, writer)
        camera_id = "unknown"

        try:
            request = await self._read_http_request(reader)
            path = request.get("path", "")
            camera_id = self._parse_camera_id(path)

            if not camera_id:
                await self._reject(writer, "404 Not Found", "Unknown websocket path")
                return

            if self._camera_manager.get_camera_source(camera_id) is None:
                await self._reject(writer, "404 Not Found", "Unknown camera_id")
                return

            key = request["headers"].get("sec-websocket-key")
            if not key:
                await self._reject(writer, "400 Bad Request", "Missing websocket key")
                return

            await self._accept(writer, key)
            await self._connections.add(camera_id, client)

            await client.send_json(
                make_event(
                    "camera.status",
                    camera_id,
                    {"state": "connected"},
                )
            )

            await self._read_until_close(client, camera_id)

        except Exception as e:
            logger.error(f"WebSocket client handler failed | camera={camera_id}", exc_info=e)
        finally:
            await self._connections.remove(camera_id, client)
            await client.send_close()
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    async def _read_http_request(self, reader: asyncio.StreamReader) -> Dict[str, Any]:
        raw = await reader.readuntil(b"\r\n\r\n")
        text = raw.decode("utf-8", errors="replace")
        lines = text.split("\r\n")

        request_line = lines[0].split()
        if len(request_line) < 2:
            raise ValueError("Invalid HTTP request line")

        headers = {}
        for line in lines[1:]:
            if not line or ":" not in line:
                continue
            key, value = line.split(":", 1)
            headers[key.strip().lower()] = value.strip()

        return {
            "path": request_line[1],
            "headers": headers,
        }

    @staticmethod
    def _parse_camera_id(path: str) -> Optional[str]:
        match = _CAMERA_PATH_RE.match(path)
        if not match:
            return None
        return match.group(1)

    async def _accept(self, writer: asyncio.StreamWriter, key: str) -> None:
        accept_value = base64.b64encode(
            hashlib.sha1((key + _WS_GUID).encode("ascii")).digest()
        ).decode("ascii")

        response = (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept_value}\r\n"
            "\r\n"
        )
        writer.write(response.encode("ascii"))
        await writer.drain()

    async def _reject(
        self,
        writer: asyncio.StreamWriter,
        status: str,
        message: str,
    ) -> None:
        try:
            body = message.encode("utf-8")
            response = (
                f"HTTP/1.1 {status}\r\n"
                "Connection: close\r\n"
                "Content-Type: text/plain; charset=utf-8\r\n"
                f"Content-Length: {len(body)}\r\n"
                "\r\n"
            ).encode("utf-8") + body
            writer.write(response)
            await writer.drain()
        except Exception:
            pass

    async def _read_until_close(self, client: WebSocketClient, camera_id: str) -> None:
        while not client.closed:
            frame = await self._read_client_frame(client.reader)
            if frame is None:
                return

            opcode, payload = frame
            if opcode == 0x8:
                return
            if opcode == 0x9:
                await client.send_pong(payload)
            elif opcode == 0x1:
                await self._handle_client_text(camera_id, payload)

    async def _handle_client_text(self, camera_id: str, payload: bytes) -> None:
        try:
            text = payload.decode("utf-8", errors="replace")
            logger.log(f"WebSocket client message | camera={camera_id} text={text}")
        except Exception as e:
            logger.error("Failed to handle WebSocket client text", exc_info=e)

    async def _read_client_frame(
        self,
        reader: asyncio.StreamReader,
    ) -> Optional[tuple[int, bytes]]:
        try:
            header = await reader.readexactly(2)
            first, second = header
            opcode = first & 0x0F
            masked = bool(second & 0x80)
            length = second & 0x7F

            if length == 126:
                length = struct.unpack("!H", await reader.readexactly(2))[0]
            elif length == 127:
                length = struct.unpack("!Q", await reader.readexactly(8))[0]

            mask = await reader.readexactly(4) if masked else b""
            payload = await reader.readexactly(length) if length else b""

            if masked:
                payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))

            return opcode, payload

        except asyncio.IncompleteReadError:
            return None
        except Exception as e:
            logger.error("Failed to read WebSocket frame", exc_info=e)
            return None
