from __future__ import annotations

from dataclasses import dataclass
from time import time
from typing import Any, Dict, Optional
from uuid import uuid4


def make_event(
    event_type: str,
    camera_id: str,
    payload: Optional[Dict[str, Any]] = None,
    timestamp: Optional[float] = None,
) -> Dict[str, Any]:
    return {
        "type": event_type,
        "event_id": str(uuid4()),
        "camera_id": camera_id,
        "timestamp": timestamp if timestamp is not None else time(),
        "payload": payload or {},
    }


@dataclass(frozen=True)
class StreamConfig:
    host: str = "127.0.0.1"
    port: int = 8765
    default_display_fps: float = 6.0
    jpeg_quality: int = 60
    max_width: int = 640

