# Building a local RAG tool with Deno Desktop and TanStack Start

Natural-language search over your starred GitHub repos, fully local: pull README and metadata, embed with something like **Gemma**, store vectors in a local **vector DB**, and ask the corpus questions without shipping your stars to a hosted RAG SaaS.

Each chapter is one slice of the stack. Fill these in as the series lands.

| Chapter | File | Status |
| --- | --- | --- |
| 1 | [Deno Desktop + TanStack Start setup](./01-deno-desktop-setup.md) | Skeleton |
| 2 | [Better Auth](./02-better-auth.md) | Skeleton |
| 3 | [Worker / processing engine](./03-worker-engine.md) | Skeleton |
| 4 | [Live activity bus (Elysia SSE)](./04-live-activity-bus.md) | Draft |
| 5 | [Query path + local RAG UX](./05-query-path.md) | Skeleton |

## Product in one line

Starred-repo **RAG** on the desktop: GitHub as the source of truth, local embeddings, vector search with natural language, progress streamed into the UI while long jobs run under API rate limits.
