# Chapter 5: Query path + local RAG UX

[Series index](./README.md) · Prev: [Chapter 4](./04-live-activity-bus.md)

## Goal

Ask the starred-repo corpus questions in natural language: embed the query, retrieve from the local **vector DB**, optionally pass hits to a local LLM, and show results in the TanStack Start UI.

## Outline (TODO)

- Query embedding (same model family as chapter 3, e.g. Gemma embeddings)
- Similarity search / ANN over stored vectors
- Ranking, filters (language, topics, owner), and empty-index states
- Optional generation: local LLM over retrieved chunks vs “citations only”
- UX: search box, hit list, repo deep links, “index still building” while chapter 3 runs
- Eval lite: a handful of golden questions over your own stars
- What we still do not build: multi-tenant hosted RAG, sync across machines

## Notes

_Write the narrative here. This is the “why you indexed anything” chapter._
