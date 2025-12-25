from dataclasses import dataclass
from typing import Any


@dataclass
class SnapshotEvent:
    """
    Represents a single snapshot taken from a camera.
    """
    camera_id: str
    frame: Any          # OpenCV frame (numpy array)
    timestamp: float    # Unix timestamp (seconds)
