# VLM Pipeline

The VLM pipeline is the original higher-level image analysis flow. It is implemented in `processing/image_pipeline.py` and is currently disabled by default in `management/supervisor.py`.

## Purpose

The pipeline analyzes visually meaningful frames with a cloud VLM and stores both visual and textual memory:

- CLIP image embedding for visual deduplication and lookup.
- VLM frame description.
- VLM rolling context.
- BGE-M3 text embedding of the description.

## Flow

```text
SnapshotEvent
  -> validate frame
  -> encode JPEG
  -> CLIP image embedding
  -> previous-frame similarity gate
  -> recent Qdrant similarity gate
  -> build VLM prompts
  -> VLMClient.analyze_image()
  -> ImageIndex.add()
  -> embed_text_sync(frame_description)
  -> TextIndex.add()
```

## Deduplication Gates

The pipeline avoids expensive VLM calls when the image is visually similar:

- Local previous-image gate:
  - Per-camera in-memory embedding.
  - Default threshold: `0.95`.

- Recent vector-store gate:
  - Searches image vectors from the last 60 seconds.
  - `ImageIndex` default threshold: `0.85`.
  - `top_k = 3`.

## Prompting

`prompts/image_analysis_prompt.py` builds two prompt parts:

- `static_prompt`
  - Stable instructions intended to be cacheable.
  - Defines role, image-first behavior, rolling context use, change detection, and strict output format.

- `dynamic_prompt`
  - Per-request business and camera context.
  - Previous rolling context.
  - Current analysis goal.

The required VLM output format is:

```text
FRAME_DESCRIPTION:
...

ROLLING_CONTEXT:
...
```

## VLM Client

`cloud/vlm_client.py`:

- Encodes image bytes as base64 when `image_buffer` is provided.
- Sends JSON to `POST {VLM_BASE_URL}/vlm_analyze`.
- Expects a response shape containing:
  - `result.openai_response.output[]`
  - at least one `output_text` content block.
- Parses the required `FRAME_DESCRIPTION` and `ROLLING_CONTEXT` sections.

## Cloud Client

`cloud/cloud_client.py`:

- Uses `requests.post`.
- Timeout is `settings.VLM_TIMEOUT_SEC`.
- Raises `CloudClientError` for request failure, HTTP errors, or invalid JSON.

## Firebase Temporary Upload

`FirebaseStorageService` can upload images and return signed URLs, but the VLM pipeline currently comments out upload/delete calls and sends image bytes directly to the VLM cloud function.

## Stored Outputs

Image vector payload includes:

- `type = clip_image`
- `camera_id`
- `timestamp`
- `timestamp_str`
- `frame_description`

Text vector payload includes:

- `frame_description`
- `rolling_context`
- `source`
- `timestamp`
- `timestamp_str`
- optional `ref_id`
- extra metadata such as `camera_id`

## Current Risks

- `VLMClient.analyze_image()` base64-encodes `image_buffer` before checking whether it is using `image_url`; calling with only `image_url` appears unsafe.
- `ImagePipeline` assumes VLM analysis contains `frame_description` and `rolling_context`.
- VLM errors are not caught around `analyze_image()` in the pipeline, so they are handled by the supervisor callback boundary.
- Business/camera metadata in the prompt is currently hard-coded in `ImagePipeline`.
