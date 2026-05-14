# OBSERVER Documentation Index

Start here when onboarding into the OBSERVER local AI service.

## Core Architecture

- [System Architecture](SYSTEM_ARCHITECTURE.md)
- [Project Structure](PROJECT_STRUCTURE.md)
- [Pipeline Flow](PIPELINE_FLOW.md)
- [Processing Flow](PROCESSING_FLOW.md)

## Visual AI Systems

- [Visual Anchor System](VISUAL_ANCHOR_SYSTEM.md)
- [VLM Pipeline](VLM_PIPELINE.md)
- [Vector Store Architecture](VECTOR_STORE_ARCHITECTURE.md)

## Runtime Integration

- [Camera Sources](CAMERA_SOURCES.md)
- [Event System](EVENT_SYSTEM.md)
- [Configuration](CONFIGURATION.md)
- [Websocket Future Design](WEBSOCKET_FUTURE_DESIGN.md)

## Maintenance

- [Dependencies and Libraries](DEPENDENCIES_AND_LIBRARIES.md)
- [Known Limitations](KNOWN_LIMITATIONS.md)
- [Future Improvements](FUTURE_IMPROVEMENTS.md)

## Current Runtime Summary

The current default runtime path is:

```text
main.py
  -> Supervisor
  -> CameraManager
  -> CameraClient
  -> VideoFileCamera
  -> CycleImagePipeline
  -> CLIP embedding
  -> Qdrant image search
  -> anomaly print hook
```

The original VLM pipeline and the cycle training pipeline exist but are disabled by constants in `management/supervisor.py`.
