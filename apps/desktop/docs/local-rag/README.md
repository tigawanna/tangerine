# Building a local RAG tool with Deno Desktop and TanStack Start

Natural-language search over your starred GitHub repos, fully local: pull README and metadata, embed with **EmbeddingGemma** on ONNX Runtime, store vectors in **PGlite + pgvector**, and ask the corpus questions without shipping your stars to a hosted RAG SaaS.

Each chapter is one slice of the stack.

| Chapter | File | Status |
| --- | --- | --- |
| 1 | [Deno Desktop + TanStack Start setup](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/01-deno-desktop-setup.md) | Draft |
| 2 | [Better Auth](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/02-better-auth.md) | Draft |
| 3 | [Worker / processing engine](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/03-worker-engine.md) | Draft |
| 4 | [Live activity bus (Elysia SSE)](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/04-live-activity-bus.md) | Draft |
| 5 | [Query path + local RAG UX](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/05-query-path.md) | Draft |

## Product in one line

Starred-repo **RAG** on the desktop: GitHub as the source of truth, local embeddings, vector search with natural language, progress streamed into the UI while long jobs run under API rate limits.
