# Camera Sources

Camera ingestion is built around configurable camera sources and per-camera snapshot clients.

## Configuration

`config/cameras_config.json` defines cameras:

- `camera_id`
- `name`
- `type`
- `enabled`
- `source`
- `snapshot_policy`
- optional `dev`

Current configured camera:

- `camera_id`: `dev_video_cam_1`
- `type`: `video_file`
- video: `cameras/devtools/videos/robots.mp4`
- interval: `0.3` seconds
- resize: `80%`
- dev UI enabled.

## Implemented Source: Video File

`cameras/camera_sources/video_file_camera.py`

Responsibilities:

- Open local video with OpenCV.
- Run a read loop in a background thread.
- Store latest frame.
- Support `play()`, `pause()`, and `stop()`.
- Loop video when end is reached if configured.

The snapshot client does not read directly from the video capture object. It calls `get_snapshot()` and receives the latest frame.

## Camera Client

`CameraClient` wraps any source implementing:

- `start()`
- `stop()`
- `play()`
- `pause()`
- `get_snapshot()`

Snapshot policy currently supports only:

```json
{
  "mode": "interval",
  "interval_seconds": 2,
  "resize_percent": 100
}
```

Unsupported policy modes are logged and the snapshot loop exits.

## Development UI

`cameras/devtools/video_player_ui.py` provides a PySide6 UI for observing a camera source.

Features:

- Play button.
- Pause button.
- QLabel video preview refreshed by `QTimer`.

The UI is optional and controlled by:

```json
"dev": {
  "ui_enabled": true
}
```

## Placeholder Sources

The following files are present but empty:

- `cameras/camera_sources/rtsp_camera.py`
- `cameras/camera_sources/onvif_camera.py`
- `cameras/onvif_discovery.py`

The architecture already has a factory point in `CameraManager._create_camera_source()`, but it currently supports only `video_file`.

## Future Source Contract

Future camera sources should preserve the same minimal interface:

- `start()`: allocate resources and begin reading.
- `stop()`: release resources.
- `play()`: resume frame updates where meaningful.
- `pause()`: pause frame updates where meaningful.
- `get_snapshot()`: return latest OpenCV frame or `None`.

For live RTSP streams, `play()` and `pause()` can be no-ops if the source should always read.
