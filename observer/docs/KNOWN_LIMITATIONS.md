# Known Limitations

This document lists observed limitations and technical debt without proposing code changes in this documentation phase.

## Architecture

- Pipeline selection is controlled by constants in `management/supervisor.py`.
- The `Supervisor.image_pipeline` attribute name is used for all pipeline types.
- The supervisor creates an asyncio loop that is not currently used by active processing.
- Scheduler and health modules are empty.

## Camera Sources

- Only `video_file` is implemented.
- RTSP and ONVIF files are placeholders.
- Camera source factory rejects unsupported camera types.
- Snapshot policy supports only interval mode.

## Configuration

- `VLM_BASE_URL` is required at import time.
- `VECTOR_SIZE` is read from the environment as a string.
- Several operational paths are hard-coded.
- Business/camera prompt details are hard-coded in `ImagePipeline`.
- Pipeline mode is not configurable from `.env` or JSON.

## Visual Anchor System

- Anchor IDs are in-memory and restart per process.
- Training has no explicit session ID.
- Training stores current embeddings even though it computes rolling merged embeddings.
- Runtime assumes anchors already exist.
- Current anomaly reporting only prints.
- No durable anomaly ID or anomaly history exists.
- No VLM explanation is wired into the cycle anomaly path.

## Vector Store

- Camera and timestamp filters are applied after vector search instead of as Qdrant filters.
- Image collection may contain multiple logical record types.
- No payload schema validation.
- No collection migration/versioning.
- No explicit deletion policy for old runtime data.

## VLM Flow

- VLM pipeline is disabled by default.
- VLM client appears unsafe for URL-only image calls because it base64-encodes `image_buffer` before checking source mode.
- VLM errors are handled at outer supervisor callback boundaries rather than locally in the VLM pipeline.
- Response parsing depends on exact model section names.

## Concurrency

- Pipeline work runs synchronously inside camera snapshot threads.
- Slow embedding, Qdrant, or VLM calls can delay snapshot cadence.
- CLIP and text models are process-wide singletons on CPU.
- Multiple camera snapshot threads could call the same model singleton concurrently after load.

## Logging and Observability

- Logs are written to a hard-coded Windows path.
- Many important events are printed rather than logged or persisted.
- No metrics endpoint.
- No health checks.
- No structured operational event stream.

## Tests

- Current `test/` content is experimental rather than automated regression coverage.
- No unit tests were observed for camera lifecycle, embedding wrappers, vector indexes, or pipeline decisions.

## Security

- `test/vlm_cropping.py` contains a placeholder API key string.
- Firebase service account path is fixed and local.
- No documented authentication or authorization model for future UI/websocket access.
