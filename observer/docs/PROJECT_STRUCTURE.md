# Project Structure

This document maps the current repository layout and responsibilities.

## Root Files

- `main.py`
  - Service entrypoint.
  - Loads `.env`, creates `Supervisor`, and runs the main loop.

- `requirements.txt`
  - Frozen Python dependencies.
  - Includes OpenCV, PySide6, Qdrant client, Firebase Admin, Transformers, Torch, Sentence Transformers, and supporting libraries.

- `mypy.ini`
  - Type checking configuration.

- `note.txt`
  - Developer notes for models, Qdrant UI, virtual environment, and annotation tooling.

## Folders

### `cameras/`

Camera source abstractions, camera lifecycle, and development video playback.

- `camera_manager.py`: loads camera config and owns camera clients.
- `camera_client.py`: periodic snapshot loop per camera.
- `camera_events.py`: `SnapshotEvent` dataclass.
- `camera_sources/video_file_camera.py`: implemented local video file source.
- `camera_sources/rtsp_camera.py`: empty placeholder.
- `camera_sources/onvif_camera.py`: empty placeholder.
- `onvif_discovery.py`: empty placeholder.
- `devtools/video_player_ui.py`: PySide6 development playback UI.
- `devtools/videos/`: local test videos.

### `cloud/`

Cloud HTTP integration.

- `cloud_client.py`: generic JSON POST client.
- `vlm_client.py`: VLM-specific request/response wrapper.
- `sync.py`: empty placeholder.

### `config/`

Configuration module and camera JSON.

- `settings.py`: environment-driven settings.
- `cameras_config.json`: enabled cameras and snapshot policy.

### `embeddings/`

Local embedding generation.

- `clip_embeddings.py`: CLIP image and CLIP text embeddings, plus embedding merge helper.
- `text_embeddings.py`: BGE-M3 text embeddings.

### `firebase/`

Firebase integration.

- `firebase_app.py`: initializes Firebase Admin SDK using `firebase/serviceAccountKey.json`.
- `storage_service.py`: uploads temporary images and deletes them by signed URL.

### `management/`

Top-level orchestration.

- `supervisor.py`: lifecycle owner and pipeline selector.
- `scheduler.py`: empty placeholder.
- `health.py`: empty placeholder.

### `pos/`

POS integration placeholders.

- `pos_client.py`: empty.
- `pos_collector.py`: empty.
- `pos_summarizer.py`: empty.

### `processing/`

Frame processing pipelines.

- `image_pipeline.py`: original VLM analysis pipeline.
- `cycle_traning_image_pipeline.py`: cycle visual-anchor training pipeline. The filename contains the current typo `traning`.
- `cycle_image_pipeline.py`: runtime visual-anchor anomaly detection.
- `similarity.py`: older read-only Qdrant similarity helper.
- `rules.py`: empty placeholder.
- `text_pipeline.py`: empty placeholder.

### `prompts/`

Prompt builders.

- `image_analysis_prompt.py`: static and dynamic prompt construction for VLM image analysis.

### `utils/`

Shared utilities and developer scripts.

- `logger.py`: crash-safe stdout and file logger.
- `extract_frames_to_jpg.py`: frame extraction and PNG-to-JPG conversion utilities.
- `open_fiftyone.py`: local FiftyOne launcher script.
- `timing.py`: empty placeholder.

### `vector_store/`

Qdrant integration and indexes.

- `qdrant_wrapper.py`: low-level Qdrant wrapper.
- `image_index.py`: image/visual memory collection wrapper.
- `text_index.py`: text semantic memory collection wrapper.

### `vlm/`

Experimental local VLM tests.

- `test.py`: Ollama-based prompt experiments.

### `test/`

Experimental tests/scripts.

- `vlm_cropping.py`: OpenAI vision localization experiment plus OpenCV crop refinement.

## Empty or Placeholder Areas

The following files currently contain no implementation:

- `management/scheduler.py`
- `management/health.py`
- `cameras/camera_sources/rtsp_camera.py`
- `cameras/camera_sources/onvif_camera.py`
- `cameras/onvif_discovery.py`
- `cloud/sync.py`
- `processing/rules.py`
- `processing/text_pipeline.py`
- `pos/pos_client.py`
- `pos/pos_collector.py`
- `pos/pos_summarizer.py`
- `utils/timing.py`
