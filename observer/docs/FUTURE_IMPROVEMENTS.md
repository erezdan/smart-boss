# Future Improvements

These are recommended improvement areas based on the current architecture. They are not implemented in this documentation phase.

## Configuration

- Move pipeline selection into environment or config file.
- Convert and validate `VECTOR_SIZE` as an integer.
- Move hard-coded file paths into settings.
- Add config schema validation for camera definitions.
- Add camera-specific prompt metadata.

## Event System

- Introduce typed events for anomaly detection, anchor matching, status, and VLM explanations.
- Add durable anomaly IDs.
- Persist anomaly history.
- Separate event generation from websocket transport.

## Visual Anchor System

- Add training session IDs.
- Store anchor metadata in a dedicated schema.
- Decide whether training should store raw or rolling merged embeddings.
- Persist anchor counters or derive anchor IDs from stored metadata.
- Add per-camera anchor lifecycle management.
- Add operator workflows for approve/reject anchors.

## Processing and Concurrency

- Move expensive pipeline work off camera snapshot threads.
- Add bounded queues per camera.
- Add backpressure policies.
- Add timing metrics for frame capture, embedding, vector search, and VLM.
- Consider GPU configuration for local models if hardware exists.

## Vector Store

- Use Qdrant payload filters for camera/time filtering.
- Split collections by logical purpose if needed:
  - cycle anchors.
  - runtime visual memory.
  - text memory.
- Add collection versioning and migration docs.
- Add retention policies.

## VLM Integration

- Wire VLM explanation generation into anomaly detections.
- Make VLM calls asynchronous or queued.
- Add retry and timeout policy per use case.
- Persist raw VLM responses or references for audit.
- Validate parsed VLM output with explicit schema checks.

## Camera Sources

- Implement RTSP source.
- Implement ONVIF discovery/source.
- Add reconnect behavior for live streams.
- Add camera status events.
- Add snapshot policies beyond fixed interval if needed.

## Observability

- Add structured logging.
- Add health checks.
- Add metrics.
- Add a diagnostic endpoint or local dashboard.
- Replace prints with logger/event publishing where appropriate.

## Testing

- Add unit tests for:
  - prompt parsing.
  - vector payload creation.
  - camera config loading.
  - static frame gates.
  - anomaly threshold decisions.

- Add integration tests with:
  - local video file.
  - mocked embedding function.
  - mocked Qdrant wrapper.
  - mocked VLM client.

## UI Integration

- Add websocket broadcaster.
- Add compact event schemas.
- Add UI commands for pause/resume and anomaly acknowledgement.
- Stream thumbnails only on demand or at controlled low rate.
