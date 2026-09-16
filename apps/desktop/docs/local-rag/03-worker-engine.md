# Chapter 3: Worker / processing engine

[Series index](./README.md) · Prev: [Chapter 2](./02-better-auth.md) · Next: [Chapter 4: Live activity bus](./04-live-activity-bus.md)

## Goal

Turn a star list into an embedded corpus: paced GitHub fetches, chunking, local **Gemma** (or similar) embeddings, upserts into a local **vector DB**, without burning the GitHub API rate limit.

## Outline (TODO)

- Why a worker (not “do it all in the request”)
- Engine choice and job model (queue, concurrency, checkpoints)
- Pipeline stages
  1. List / page starred repos
  2. Pull README and light metadata
  3. Chunk text for embedding
  4. Batch embed under local model constraints
  5. Upsert vectors + metadata for retrieval
- Rate limiting: sleep / token bucket against GitHub secondary limits
- Resume after restart: what is durable vs what is progress UI only
- Emitting progress events for [chapter 4](./04-live-activity-bus.md) (“fetched X”, “embedded 40/200”, …)
- Failure modes: 404 README, huge repos, embedding OOM, partial indexes

## Notes

_Write the narrative here. This is the “RAG indexing” chapter; keep model and vector-store picks concrete when you lock them._
