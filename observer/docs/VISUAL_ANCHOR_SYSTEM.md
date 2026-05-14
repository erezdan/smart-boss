# Visual Anchor System

The visual anchor system is the newer anomaly-detection concept. It uses local image embeddings and Qdrant similarity search to learn and recognize normal visual states.

## Conceptual Model

- A frame is embedded using CLIP.
- Similar frames are grouped under an `anchor_id`.
- Anchors represent recurring visual states in a machine or operational cycle.
- Runtime frames are compared against stored anchors.
- Low similarity or no match is treated as visual drift/anomaly.

## Training Pipeline

Implemented in `processing/cycle_traning_image_pipeline.py`.

### Steps

1. Receive `SnapshotEvent`.
2. Stop training once `_max_training_vectors` is exceeded.
3. Convert frame to JPEG.
4. Generate CLIP embedding.
5. Skip static frames with cosine similarity >= `0.99`.
6. Compute rolling merged embedding using `merge_embeddings`.
7. Search Qdrant for existing similar anchors.
8. Reuse best match `anchor_id`, or assign a new one.
9. Save source frame to anchor-specific folder.
10. Upsert image vector to Qdrant with anchor metadata.

### Dynamic Similarity Threshold

The training threshold increases with ingestion sequence:

- Base threshold: `0.988`
- Step: `0.003`
- Step size: `100`
- Max threshold: `0.99`

This makes anchor matching stricter as training progresses.

### Training Stop and Pruning

When `_ingest_seq > _max_training_vectors`:

- Deletes oldest `30%` of vectors using `ingest_seq`.
- Prints anchor distribution.
- Stops further training for that pipeline instance.

## Runtime Pipeline

Implemented in `processing/cycle_image_pipeline.py`.

### Steps

1. Receive `SnapshotEvent`.
2. Convert frame to JPEG.
3. Optionally replace frame with an injected anomaly image.
4. Generate CLIP embedding.
5. Skip static frames with cosine similarity >= `0.995`.
6. Search Qdrant for similar vectors for the same camera.
7. If no match, report `no_similar_vectors`.
8. If best score is below `0.97`, report `similarity_drop`.

## Anomaly Injection

`CycleImagePipeline` checks:

```text
c:/smart-boss-files/images/anomaly/
```

If exactly one `.jpg` exists in that folder, it is used instead of the live/current frame before embedding. If zero or more than one JPG exists, injection is skipped.

This appears to be a development/testing mechanism.

## Current Anomaly Output

Current anomaly reporting is local:

- Prints anomaly information.
- Does not persist anomaly records.
- Does not call VLM.
- Does not pause processing.
- Does not publish websocket events.

## Important Implementation Detail

Training computes a rolling merged embedding, but currently stores `curr_embedding` rather than the merged tensor. This may be intentional or incomplete. Treat this as an area to verify before changing behavior.

## Current Anchor Payload

Training points include:

- `type = clip_image`
- `camera_id`
- `timestamp`
- `timestamp_str`
- `frame_description = None`
- `pipeline = cycle_training`
- `anchor_id`
- `ingest_seq`

## Limitations

- Anchor IDs are in-memory counters and restart at `1` for each process run.
- There is no explicit training session ID.
- There is no per-camera anchor counter.
- Runtime uses the same image collection namespace as configured globally.
- Runtime assumes trained anchors already exist.
- Anomaly reports are not structured events yet.
- No automatic VLM explanation is currently wired into anomaly detection.
