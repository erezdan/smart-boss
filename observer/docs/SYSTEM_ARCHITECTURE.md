# OBSERVER System Architecture

OBSERVER is a local Python service in the Smart Boss project. It consumes camera frames, performs local visual embedding, compares frames against vector memory, and can call a cloud VLM service for richer image analysis.

The active runtime mode is selected in `management/supervisor.py` by module-level constants:

- `USE_IMAGE_PIPELINE = False`
- `USE_CYCLE_TRINING_PIPELINE = False`
- `USE_CYCLE_PIPELINE = True`

This means the current default runtime uses `CycleImagePipeline` for visual-anchor anomaly detection.

## High-Level Components

```text
main.py
  -> Supervisor
     -> CameraManager
        -> CameraClient per camera
           -> CameraSource
              -> SnapshotEvent
     -> Processing Pipeline
        -> CLIP embeddings
        -> Qdrant vector search / storage
        -> optional VLM analysis
        -> optional text embedding storage
```

## Component Responsibilities

- `main.py`
  - Loads environment variables with `dotenv`.
  - Resolves `config/cameras_config.json`.
  - Creates and starts `Supervisor`.
  - Runs either the Qt event loop or a simple process loop.

- `management.supervisor.Supervisor`
  - Owns top-level lifecycle.
  - Creates a background asyncio event loop, although current active processing is synchronous.
  - Creates `CameraManager`.
  - Routes all `SnapshotEvent` objects into the selected processing pipeline.

- `cameras.camera_manager.CameraManager`
  - Loads camera JSON configuration.
  - Creates camera source instances.
  - Creates one `CameraClient` per enabled camera.
  - Optionally opens a PySide6 video player UI for development.

- `cameras.camera_client.CameraClient`
  - Runs a snapshot loop in a background thread.
  - Pulls frames from a camera source at configured intervals.
  - Optionally resizes frames.
  - Emits `SnapshotEvent`.

- `processing.*`
  - Contains multiple pipelines:
    - `ImagePipeline`: original VLM-driven visual memory flow.
    - `CycleTrainingImagePipeline`: anchor learning flow.
    - `CycleImagePipeline`: runtime anomaly detection flow.

- `embeddings.*`
  - Loads local embedding models lazily as process-wide singletons.
  - `clip_embeddings.py` uses CLIP ViT-B/16 for image and CLIP text embeddings.
  - `text_embeddings.py` uses BAAI/bge-m3 for semantic text embeddings.

- `vector_store.*`
  - Wraps Qdrant operations.
  - Provides image and text indexes over Qdrant collections.

- `cloud.*`
  - Calls the configured VLM cloud endpoint.
  - Parses structured VLM responses.

- `firebase.*`
  - Supports temporary image upload to Firebase Storage.
  - Currently present but upload/delete calls are commented in the main VLM pipeline.

## Runtime Threading Model

- Main thread:
  - Starts supervisor.
  - Runs Qt event loop if dev UI is enabled.
  - Otherwise runs `Supervisor.run_forever()`.

- Supervisor asyncio thread:
  - Created in `Supervisor.start()`.
  - Current code does not route active work through this loop.

- Camera source read thread:
  - `VideoFileCamera` maintains a continuous read loop and stores the latest frame.

- Camera client snapshot thread:
  - Each `CameraClient` has a thread that periodically reads the latest frame and calls the pipeline synchronously.

- Optional Qt UI thread:
  - PySide6 UI uses `QTimer` to render snapshots.

## Implemented vs Planned

Implemented:

- Local video-file camera source.
- Development video player UI.
- Interval-based snapshot capture.
- CLIP image embedding.
- Qdrant collection creation, upsert, query, scroll, and filtered delete.
- Original VLM image analysis pipeline.
- Cycle training and runtime visual-anchor pipelines.
- Simple file/stdout logger.

Partially implemented or placeholder:

- RTSP camera source.
- ONVIF camera source and discovery.
- Scheduler and health modules.
- POS collection and summarization modules.
- Websocket streaming.
- Event publishing beyond local prints/logs.

Unknown:

- Production process manager.
- Deployment topology.
- Authentication model for the VLM cloud endpoint.
- Full UI contract for industrial monitoring.
