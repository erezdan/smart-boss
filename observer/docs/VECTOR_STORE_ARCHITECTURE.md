# Vector Store Architecture

OBSERVER uses Qdrant as its vector database.

## Qdrant Wrapper

`vector_store/qdrant_wrapper.py` is the low-level wrapper around the Qdrant Python client.

Responsibilities:

- Connect to Qdrant.
- Ensure collections exist.
- Upsert vectors.
- Query vectors.
- Scroll collection contents.
- Delete by payload filter.

Default connection:

- Host: `localhost`
- Port: `6333`
- `prefer_grpc = False`

## Image Index

`vector_store/image_index.py` represents visual memory.

Collection:

- `COLLECTION_NAME = settings.VECTOR_STORE_NAMESPACE`
- `VECTOR_SIZE = settings.VECTOR_SIZE`
- Distance: cosine

Important note: `settings.VECTOR_SIZE` currently comes directly from `os.getenv`, so it is a string unless converted elsewhere. Qdrant collection creation expects an integer vector size. This should be verified during runtime setup.

### Image Search

`search_similar()`:

- Queries Qdrant by embedding.
- Uses `top_k` and `score_threshold`.
- Filters returned hits by `camera_id` in Python after Qdrant query.

`search_similar_last_minute()`:

- Same as image search.
- Filters results to payload timestamps from the last 60 seconds.
- Filters by camera ID.

### Image Add

`add()` stores:

- `type`
- `camera_id`
- `timestamp`
- `timestamp_str`
- `frame_description`
- additional metadata

### Anchor Maintenance

`delete_by_ingest_percent()`:

- Computes a cutoff from total ingested count.
- Deletes all points where `ingest_seq <= cutoff`.

`print_anchor_distribution()`:

- Scrolls all points.
- Counts payload `anchor_id` values.
- Prints distribution.

## Text Index

`vector_store/text_index.py` represents textual memory.

Collection:

- `COLLECTION_NAME = text_vectors`
- `VECTOR_SIZE = 1024`
- Distance: cosine

Stored payload:

- `frame_description`
- `rolling_context`
- `source`
- `timestamp`
- `timestamp_str`
- optional `ref_id`
- optional metadata

Search supports optional source filtering after Qdrant query.

## Older Similarity Helper

`processing/similarity.py` defines `SimilaritySearcher`, a read-only Qdrant search abstraction. It appears older or currently unused by the active pipelines, which use `ImageIndex` and `TextIndex` instead.

## Data Model Notes

The image collection stores multiple logical record types:

- Runtime image descriptions from `ImagePipeline`.
- Cycle training anchors from `CycleTrainingImagePipeline`.
- Potential CLIP text entries through `ImageIndex.add_clip_text()`.

Because these share one collection namespace, payload fields should be treated as part of the application-level schema.

## Operational Assumptions

- Qdrant must be running before the service starts.
- Collections are created lazily.
- Vector dimensions in settings must match the model output:
  - CLIP ViT-B/16 image embeddings: 512 dimensions.
  - BGE-M3 text embeddings: 1024 dimensions.

## Known Limitations

- Filtering by camera and timestamp happens after vector query, not as a Qdrant filter.
- No schema validation for payloads.
- No migration or collection versioning.
- No explicit separation between training sessions.
- No retention policy except training prune by `ingest_seq`.
