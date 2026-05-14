# Processing Flow

This document focuses on frame processing, lifecycle, concurrency, and failure boundaries.

## Lifecycle

```text
Process start
  -> load .env
  -> import settings
  -> create Supervisor
  -> create selected pipeline
  -> create CameraManager
  -> load camera config
  -> start camera source(s)
  -> start snapshot thread(s)
  -> run Qt app or run_forever loop
```

## Processing Boundary

All camera snapshots reach a single method:

```text
Supervisor.on_camera_snapshot(snapshot_event)
```

This method calls:

```text
self.image_pipeline.process_snapshot(snapshot_event)
```

The attribute name is `image_pipeline` even when the selected object is a cycle training or cycle runtime pipeline.

## Synchronous Work in Snapshot Threads

Processing currently runs synchronously in the `CameraClient` snapshot thread. This means embedding generation, Qdrant search, and VLM calls can delay the next snapshot for that camera.

`CameraClient` uses smart sleep:

```text
sleep_time = interval_seconds - processing_elapsed
```

If processing takes longer than the interval, the loop immediately continues without sleep.

## CPU-Bound Work

CLIP and BGE-M3 are loaded as lazy singletons and run on CPU:

- `CLIPModel.to("cpu")`
- `SentenceTransformer(..., device="cpu")`

Async wrappers exist, but active pipelines call synchronous embedding functions.

## Frame Encoding

All implemented image pipelines convert OpenCV frames to JPEG before embedding or VLM use.

Typical settings:

- Max width: `384`
- JPEG quality: `60`

This reduces payload and model input size at the cost of detail.

## Failure Handling

The service heavily favors availability:

- Camera source errors are logged and retried or isolated.
- Camera initialization failure for one camera does not stop other cameras.
- Snapshot callback errors are caught.
- Encoding and embedding errors are logged.
- Logger itself swallows errors.

## Logging

`utils/logger.py` writes to:

```text
c:\smart-boss-files\logs\YYYY-MM-DD-logs.txt
```

It also writes to stdout.

The logger:

- Uses a thread lock for file writes.
- Formats exceptions when provided.
- Avoids raising even if log directory or disk writes fail.

## Current Output Channels

Implemented outputs:

- stdout prints.
- log file records.
- Qdrant vector records.
- training image files.

Not implemented as structured output:

- anomaly event store.
- websocket stream.
- alert dispatch.
- UI status state.
- metrics endpoint.
