# Building a local RAG tool with Deno Desktop and TanStack Start

Natural-language search over your starred GitHub repos, fully local: pull README and metadata, embed with **EmbeddingGemma** on ONNX Runtime, store vectors in **PGlite + pgvector**, and ask the corpus questions without shipping your stars to a hosted RAG SaaS.

Each chapter is one slice of the stack.

| Chapter | File                                                                                                                                         | Published                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | [Deno Desktop + TanStack Start setup](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/01-deno-desktop-setup.md) | [Deno Desktop the basics](https://www.tigawanna.vip/blogs/bulding-a-local-rag-tool-with-deno-desktop-31d4)                                          |
| 2       | [Better Auth](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/02-better-auth.md)                                | [Deno desktop Better Auth integration](https://www.tigawanna.vip/blogs/deno-desktop-better-auth-intergration-32ni)                                  |
| 3       | [Worker / processing engine](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/03-worker-engine.md)               | [Queues and workflows with Conveyor](https://www.tigawanna.vip/blogs/queues-and-workflows-with-conveyor-48kk)                                       |
| 4       | [Live activity bus (Elysia SSE)](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/04-live-activity-bus.md)       | [Live activity bus (Elysia SSE + pub/sub)](https://www.tigawanna.vip/blogs/live-activity-bus-elysia-sse-pubsub-powered-by-nodejs-event-emitter-ojk) |
| 5       | [Query path + local RAG UX](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/05-query-path.md)                   | [Setting up vector search for GitHub starred repos](https://www.tigawanna.vip/blogs/setting-up-vector-search-for-github-starred-repos-6f5)          |

## Product in one line

Starred-repo **RAG** on the desktop: GitHub as the source of truth, local embeddings, vector search with natural language, progress streamed into the UI while long jobs run under API rate limits.
