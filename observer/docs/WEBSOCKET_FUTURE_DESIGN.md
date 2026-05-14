# Websocket Future Design

Websocket support is not implemented in the current codebase. This document proposes an architecture compatible with the existing runtime.

## Goals

- Stream camera status to the industrial monitoring UI.
- Stream anomaly detections in near real time.
- Stream anchor match telemetry for debugging and operations.
- Allow operator commands such as pause/resume/acknowledge.
- Avoid blocking camera snapshot threads on websocket clients.

## Recommended Architecture

```text
Processing Pipeline
  -> EventBus.publish(event)
     -> In-memory queue
        -> WebsocketBroadcaster
           -> connected UI clients
        -> optional persistence sink
        -> optional alert sink
```

## Key Separation

Do not make processing pipelines depend directly on websocket code. Pipelines should emit typed events into an event bus. The websocket layer should serialize and broadcast those events.

Suggested modules:

```text
events/
  models.py
  bus.py
  sinks.py

websocket/
  server.py
  broadcaster.py
  schemas.py
```

## Event Bus

Responsibilities:

- Accept events from any thread.
- Provide non-blocking publish.
- Buffer recent events.
- Fan out to sinks.

Because camera snapshot callbacks run in worker threads, the event bus should be thread-safe.

## Websocket Server

Responsibilities:

- Manage connected clients.
- Subscribe clients to event streams.
- Send serialized event messages.
- Receive operator commands.
- Validate command schemas.

Potential commands:

- `camera.pause`
- `camera.resume`
- `anomaly.acknowledge`
- `pipeline.mode.set`
- `training.start`
- `training.stop`

## Suggested Message Envelope

```json
{
  "type": "anomaly.detected",
  "event_id": "uuid",
  "timestamp": 1760000000.0,
  "camera_id": "dev_video_cam_1",
  "payload": {}
}
```

## Backpressure

The UI should not receive every frame by default. Recommended streams:

- Low-rate status heartbeat.
- Anchor match telemetry with sampling.
- Anomaly events always.
- Optional debug frame thumbnails on demand.

If frame streaming is required, use a separate path from event telemetry and enforce FPS/quality limits.

## Integration Points

Current clean integration points:

- `Supervisor.on_camera_snapshot()`
- `CycleImagePipeline._report_anomaly()`
- `CameraClient` status transitions.
- `VideoFileCamera.play()` / `pause()`.

## Initial Implementation Strategy

1. Introduce event dataclasses without changing pipeline behavior.
2. Add an in-memory event bus.
3. Make anomaly reporting publish events in addition to printing/logging.
4. Add websocket broadcaster as an optional subsystem in `Supervisor`.
5. Add command handling only after event streaming is stable.

## Open Questions

- Should websocket be served by this process or by a separate API service?
- Should event history be persisted locally?
- What UI needs real images versus metadata-only events?
- How should anomaly acknowledgements be stored?
- What authentication is required for local factory deployments?
