# Pipeline Flow

OBSERVER currently has three meaningful image-processing flows:

- Original VLM image pipeline.
- Cycle training pipeline.
- Cycle runtime anomaly pipeline.

Only one pipeline is selected at runtime by constants in `management/supervisor.py`.

## Common Frame Ingestion Flow

```text
VideoFileCamera read loop
  -> latest frame stored in memory
CameraClient snapshot loop
  -> get_snapshot()
  -> optional resize
  -> SnapshotEvent(camera_id, frame, timestamp)
CameraManager safe callback
  -> Supervisor.on_camera_snapshot()
  -> selected_pipeline.process_snapshot(event)
```

## Snapshot Event

`SnapshotEvent` is defined in `cameras/camera_events.py`:

- `camera_id`: logical camera identifier from config.
- `frame`: OpenCV/Numpy frame.
- `timestamp`: Unix timestamp in seconds.

## Active Runtime Flow: Cycle Anomaly Detection

Default selected pipeline:

```text
SnapshotEvent
  -> frame to JPEG
     -> optional anomaly image injection
     -> resize to max width 384
     -> JPEG quality 60
  -> CLIP image embedding
  -> skip if too similar to previous frame for camera
  -> Qdrant image index search, top_k=5
  -> compare best score to anomaly threshold
  -> print anomaly if no match or score is too low
```

Important thresholds in `CycleImagePipeline`:

- `anomaly_threshold = 0.97`
- `static_frame_threshold = 0.995`

The current anomaly reporting hook prints to stdout. It does not yet persist an event, publish websocket messages, pause camera processing, or invoke VLM explanation.

## Cycle Training Flow

`CycleTrainingImagePipeline` is intended to build visual anchors for normal machine cycles.

```text
SnapshotEvent
  -> frame to JPEG
  -> CLIP image embedding
  -> skip static frame if similarity >= 0.99
  -> rolling merge helper is computed
  -> search existing anchors using dynamic threshold
  -> reuse matching anchor_id or allocate new anchor_id
  -> save training frame under anchor directory
  -> upsert image embedding to Qdrant with anchor metadata
  -> stop/prune after max training vectors
```

Training metadata stored in Qdrant includes:

- `pipeline = cycle_training`
- `camera_id`
- `anchor_id`
- `ingest_seq`

Training images are saved under:

```text
c:/smart-boss-files/images/training/anchor_XXXX/
```

## Original VLM Image Pipeline

`ImagePipeline` performs low-frequency semantic analysis for frames that appear visually meaningful.

```text
SnapshotEvent
  -> frame validation
  -> JPEG resize/encode
  -> CLIP image embedding
  -> local previous-frame similarity gate
  -> Qdrant recent-image similarity gate
  -> VLM prompt generation
  -> cloud VLM image analysis
  -> store image embedding with frame description
  -> BGE-M3 text embedding of VLM description
  -> store text embedding with rolling context
```

The pipeline keeps `prev_rolling_context` per camera and feeds it into the next VLM prompt.

## Error Handling Pattern

Most runtime methods are designed to never raise beyond their boundary:

- Camera loops catch and log frame acquisition errors.
- Snapshot callbacks catch and log processing errors.
- Pipelines catch embedding and encoding failures.
- Logger is designed to never raise.

This is appropriate for an edge service, but it also means failures may be visible only in logs and prints unless structured events are added.
