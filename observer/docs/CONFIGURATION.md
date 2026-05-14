# Configuration

OBSERVER uses environment variables plus a camera JSON file.

## Environment Loading

`main.py` calls:

```python
load_dotenv()
```

Then it imports and uses settings through module imports.

## Settings Module

`config/settings.py` reads environment variables at import time.

### Required

- `VLM_BASE_URL`
  - Required.
  - If missing, `settings.py` raises `RuntimeError`.

### Optional With Defaults

- `ENV`
  - Default: `local`.

- `VLM_TIMEOUT_SEC`
  - Default: `30`.
  - Converted to `int`.

- `LOG_LEVEL`
  - Default: `INFO`.
  - Currently not used by `utils.logger`.

### Optional Without Defaults

- `VLM_MODEL`
- `CLIP_TEXT_MODEL`
- `TEXT_EMBEDDING_MODEL`
- `VECTOR_STORE_NAMESPACE`
- `VECTOR_SIZE`

Important: `VECTOR_SIZE` is read as a string. Qdrant collection creation expects an integer size.

## Camera Configuration

`main.py` resolves:

```text
config/cameras_config.json
```

Current schema:

```json
{
  "cameras": [
    {
      "camera_id": "dev_video_cam_1",
      "name": "Seller ignores customer - dev video",
      "type": "video_file",
      "enabled": true,
      "source": {
        "video_path": "C:\\DEV\\smart-boss\\observer\\cameras\\devtools\\videos\\robots.mp4",
        "loop": true,
        "start_paused": false
      },
      "snapshot_policy": {
        "mode": "interval",
        "interval_seconds": 0.3,
        "resize_percent": 80
      },
      "dev": {
        "ui_enabled": true
      }
    }
  ]
}
```

## Hard-Coded Paths

The code currently uses several hard-coded local paths:

- Logs:
  - `c:\smart-boss-files\logs`

- Training images:
  - `c:/smart-boss-files/images/training/`

- Anomaly injection images:
  - `c:/smart-boss-files/images/anomaly/`

- Firebase service account:
  - `firebase/serviceAccountKey.json`

These should be documented operational requirements until moved into configuration.

## Pipeline Selection

Pipeline mode is currently selected by editing constants in `management/supervisor.py`, not by environment/config:

- `USE_IMAGE_PIPELINE`
- `USE_CYCLE_TRINING_PIPELINE`
- `USE_CYCLE_PIPELINE`

This is functional for local development but should become configuration before production use.
