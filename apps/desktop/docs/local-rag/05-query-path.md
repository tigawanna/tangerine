# Chapter 5: Query path + local RAG UX

[Series index](./README.md) · Prev: [Chapter 4](./04-live-activity-bus.md)

## Goal

Ask the starred-repo corpus questions in natural language: embed the query on-device, rank the stored vectors, and show the matching repos in the TanStack Start UI.

This is where the earlier chapters pay off. Auth (chapter 2) got us a GitHub token, the worker (chapter 3) turned stars into vectors, the bus (chapter 4) kept the UI honest while it ran, and now a search box turns a sentence into a ranked list.

## One query, end to end

```text
 "graph databases in Rust"
        |
        |  600 ms debounce, ?q= in the URL
        v
 useQuery -> Eden: GET /api/elysia/enrich/starred/search?q=...
        |
        v
 Elysia route (TypeBox: 1..2000 chars)
        |
        v
 embedQuery(text)  -- EmbeddingGemma 300M, query prompt
        |             ONNX Runtime (onnxruntime-node, CPU), Q4 weights
        v
 Float32Array(768)
        |
        v
 PGlite + pgvector:  ORDER BY embedding <=> $query  LIMIT 50
        |
        v
 rows (no vector blob) -> list of repo links
```

Everything below the Elysia route runs inside the desktop app's Deno process. No request leaves the machine.

## The model: EmbeddingGemma

[EmbeddingGemma](https://ai.google.dev/gemma/docs/embeddinggemma) is Google's 308M-parameter embedding model built on Gemma 3, designed for phones and laptops. The properties that matter here:

- **768-dimensional vectors.** The size can be cut down to 512, 256, or 128 through Matryoshka representation learning. We keep 768.
- **2K-token context**, which is roomy for a repo's metadata plus the top of its README (chapter 3).
- **100+ languages**, so non-English READMEs and queries still land.
- **Small when quantized.** Google quotes under 200 MB of RAM with quantization.
- **Fully offline** once the weights are on disk.

We run the [`onnx-community/embeddinggemma-300m-ONNX`](https://huggingface.co/onnx-community/embeddinggemma-300m-ONNX) export through [`@kessler/gemma-embedding`](https://github.com/kessler/gemma-embedding), a small wrapper over Transformers.js that uses native `onnxruntime-node` in Node-compatible runtimes. Our own package, [`packages/gemma-embedding`](../../../../packages/gemma-embedding/src/node.ts), adds a shared instance, quantization switching, download progress, and cache inspection on top.

### Documents and queries are embedded differently

EmbeddingGemma is **asymmetric**: the text is wrapped in a different prompt depending on whether it's something to find or something to search with. From the wrapper's source:

```ts
const prefixed =
  mode === "query"
    ? `task: search result | query: ${text}`
    : `title: none | text: ${text}`;
```

So the worker embeds repos with `embedDocument()` and search embeds the user's sentence with `embedQuery()`. Mixing the two up still returns results, just noticeably worse ones. That's why both are exported as separate named functions rather than a `mode` flag callers could forget ([`instance.ts`](../../../../packages/gemma-embedding/src/node-runtime/instance.ts)):

```ts
export async function embedDocument(text: string) {
  const embedding = await getServerGemmaEmbedding();
  return embedding.embed(text, "document");
}

export async function embedQuery(text: string) {
  const embedding = await getServerGemmaEmbedding();
  return embedding.embed(text, "query");
}
```

### One shared model instance

Loading the model takes a few seconds and a few hundred MB, so there's exactly one instance per process. It's created on first use, and concurrent callers await the same load promise:

```ts
export async function getServerGemmaEmbedding(options?: GemmaEmbeddingOptions) {
  if (options?.dtype && options.dtype !== getActiveGemmaDtype()) {
    await disposeInstance(); // switching quantization: drop the old one
    setActiveDtypeInternal(options.dtype);
  }

  let instance = getEmbeddingInstance();
  if (instance?.isLoaded()) return instance;

  if (!instance) {
    const { GemmaEmbedding } = await import("@kessler/gemma-embedding");
    instance = new GemmaEmbedding(resolveServerGemmaOptions({ ...options, dtype: getActiveGemmaDtype() }));
    setEmbeddingInstance(instance);
  }

  if (!getEmbeddingLoadPromise()) setEmbeddingLoadPromise(instance.load() /* + progress + error handling */);
  await getEmbeddingLoadPromise();
  return getEmbeddingInstance()!;
}
```

The worker and the search route share this instance, so indexing and searching at the same time don't load the model twice.

### Quantization

The ONNX export ships several weight files. Settings lets the user pick one ([`catalog.ts`](../../../../packages/gemma-embedding/src/catalog.ts)):

| Variant | Download | Notes                                       |
| ------- | -------- | ------------------------------------------- |
| `q4`    | ~197 MB  | Default. Smallest, and fine for repo search |
| `q8`    | ~309 MB  | Balanced                                    |
| `fp16`  | ~618 MB  | Higher quality                              |
| `fp32`  | ~1.2 GB  | Full precision                              |

All variants run on the CPU (`device: "cpu"`). `GEMMA_DTYPE` and `GEMMA_MODEL_PATH` override the choice from the environment, which is handy for pointing at a pre-downloaded model.

## ONNX Runtime inside a Deno Desktop binary

`onnxruntime-node` is a native addon, a `.node` binary per OS and architecture. Bundling every platform's copy into the desktop binary would bloat it for no benefit, so the packaging step excludes it:

```json
"desktop:build": "... deno desktop ... --exclude-unused-npm --exclude ./.output/server/node_modules/onnxruntime-node --compress ..."
```

At runtime, [`ort-runtime.ts`](../../src/lib/embedding-gemmma/ort-runtime.ts) resolves ORT in two steps. In dev, the normal `node_modules` copy just works. In a packaged build, it uses a copy downloaded on first run into the config dir:

```ts
export async function ensureOrtReady(): Promise<void> {
  if (await canImportOrt()) return; // bundled / dev node_modules
  if (!downloadedOrtReady()) return; // nothing downloaded yet
  ensureOrtModulePath(); // prepend ~/.config/tangerine-desktop/native/node_modules to NODE_PATH
}
```

The download pulls the pinned `onnxruntime-node` tarball (the version must match what Transformers.js expects) straight from the npm registry. It extracts the tarball, deletes the binaries for other operating systems, and adds `onnxruntime-common` next to it:

```ts
const tarballUrl = `https://registry.npmjs.org/onnxruntime-node/-/onnxruntime-node-${ORT_NPM_VERSION}.tgz`;
// fetch with progress -> tar -xzf -> keep bin/napi-v6/<this OS>/ -> fetch onnxruntime-common
```

Every embed call goes through `ensureOrtReady()` before importing the model package, which is why that line appears in both `embedRepo()` and the search helper.

## First run: the bootstrap

A fresh install has neither ORT nor model weights. The first time the app opens, it fetches both in the background with a progress toast. It's modelled on an IDE's first-run downloads and is cancellable from the toast.

The server side ([`embedding-bootstrap.ts`](../../src/lib/embedding-gemmma/embedding-bootstrap.ts)) runs the two downloads in order:

```ts
void (async () => {
  await ensureOrtReady();
  await beginOrtRuntimeDownload(); // ~40 MB, skipped if ORT already imports
  await awaitOrtRuntimeDownload();

  const q4 = inspectGemmaCache().variants.find((v) => v.id === "q4");
  if (q4?.ready) return;
  beginServerGemmaDtypeSwitch("q4"); // ~197 MB of weights, then load
})();
```

Progress is streamed with the chapter 4 SSE pattern. This source is a status snapshot rather than an event bus, so the generator polls once a second, only sends when something changed, and closes itself when the downloads finish ([`models/bootstrap.ts`](../../src/elysia/routes/models/bootstrap.ts)):

```ts
.get("/events", async function* ({ request }) {
  let previous: string | null = null;
  while (!request.signal.aborted) {
    const status = await getEmbeddingBootstrapStatus();
    const serialized = JSON.stringify(status);
    if (serialized !== previous) {
      previous = serialized;
      yield sse({ data: status });
    }
    if (!isLive(status)) break;
    await sleep(1000, request.signal);
  }
})
```

On the client, [`EmbeddingBootstrapHost`](../../src/components/embeddings/EmbeddingBootstrapHost.tsx) is mounted once. It calls `POST /embedding/bootstrap/start` when the server says `shouldAutoStart`, and renders the toast with a progress bar and a Cancel button.

## Storage: pgvector in PGlite

Vectors live next to the repo rows in embedded Postgres ([PGlite](https://pglite.dev/docs/) with the [pgvector](https://github.com/pgvector/pgvector) extension). The column width comes from the same constant the model package exports, so the two can't drift apart ([`project-enrichment-outputs.ts`](../../src/pglite/schema/project-enrichment-outputs.ts)):

```ts
// packages/gemma-embedding/src/constants.ts
export const EMBEDDING_MODEL_ID = "embeddinggemma-300m";
export const EMBEDDING_DIMENSIONS = 768;
```

```ts
export const projectEnrichmentOutputs = pgTable("project_enrichment_outputs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  type: text("type").$type<"starred" | "repos" | "other">(),
  description: text("description"),
  summary: text("summary"),
  payload: jsonb("payload").notNull(), // { text } = the exact document that was embedded
  modelId: text("model_id"), // which model produced `embedding`
  embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
  embeddedAt: timestamp("embedded_at", { withTimezone: true }),
  // ...
});
```

Storing `payload.text` and `modelId` makes the index easy to reason about later. You can see exactly what was embedded, and if the model ever changes you know which rows to re-embed.

## Search

The whole retrieval step is one function ([`search.ts`](../../src/elysia/routes/enrich/starred/helpers/search.ts)): embed the query, then let Postgres sort by cosine distance using Drizzle's `cosineDistance` (pgvector's `<=>` operator):

```ts
export async function searchStarredByQuery(q: string): Promise<StarredSearchHit[]> {
  const text = q.trim().slice(0, EMBED_TEXT_MAX_CHARS);
  if (!text) return [];

  await ensureOrtReady();
  const { embedQuery, getServerGemmaEmbedding } = await import("@repo/gemma-embedding/node");
  await getServerGemmaEmbedding({ dtype: readGemmaPrefs().dtype });
  const vector = Array.from(await embedQuery(text));

  const distance = sql<number>`${cosineDistance(projectEnrichmentOutputs.embedding, vector)}`;

  return db
    .select({ id: projectEnrichmentOutputs.id, owner: projectEnrichmentOutputs.owner, name: projectEnrichmentOutputs.name, description: projectEnrichmentOutputs.description, /* … */ distance })
    .from(projectEnrichmentOutputs)
    .where(and(eq(projectEnrichmentOutputs.type, "starred"), isNotNull(projectEnrichmentOutputs.embedding)))
    .orderBy(distance)
    .limit(50);
}
```

The select lists columns explicitly and leaves out `embedding`, so 768 floats per row never cross into the UI.

Right now this is an **exact scan**: Postgres computes the distance to every starred row. For a personal star list (hundreds to a few thousand rows) that's a small amount of work and always returns the true nearest neighbours. If the corpus grows much larger, an approximate HNSW index is one custom migration. drizzle-kit can't generate `USING hnsw`, so it would be hand-written:

```sql
CREATE INDEX project_enrichment_outputs_embedding_hnsw
  ON project_enrichment_outputs USING hnsw (embedding vector_cosine_ops);
```

The route exposes the search with validation and OpenAPI docs ([`enrich/starred/index.ts`](../../src/elysia/routes/enrich/starred/index.ts)):

```ts
.get("/search", ({ query }) => searchStarredByQuery(query.q), {
  query: t.Object({
    q: t.String({ minLength: 1, maxLength: 2000, description: "Natural-language query; embedded then ranked by cosine distance." }),
  }),
})
```

## The UI

The starred page ([`EnrichedStarred.tsx`](../../src/routes/_dashboard/$user/enriched/-components/starred/EnrichedStarred.tsx)) reuses the app's normal list scaffold. The search box writes `?q=` to the URL after a 600 ms debounce, and a query hook calls the typed Eden client:

```tsx
const q = (routeApi.useSearch().q ?? "").trim();

const semantic = useQuery({
  queryKey: ["enriched-starred-search", q],
  enabled: q.length > 0,
  placeholderData: (previous) => previous, // keep old hits on screen while the next query embeds
  queryFn: async () => {
    const { data, error } = await getElysiaTreaty().enrich.starred.search.get({ query: { q } });
    if (error) throw new Error(treatyErrorMessage(error));
    return data ?? [];
  },
});

const rows = q ? (semantic.data ?? []) : allRows;
```

A few small choices make it feel local rather than remote:

- **The placeholder hints at meaning, not keywords**: "Try natural language — e.g. graph databases in Rust…".
- **The loading state says "Embedding query…"** instead of a generic spinner, which also explains the short wait on the very first search while the model loads.
- **`placeholderData`** keeps the previous results visible while you refine the query, so the list doesn't flash empty on every keystroke.
- **No query means the full corpus.** An empty `q` shows every embedded star, paginated, and that list keeps growing live during indexing (chapter 4).
- **Each hit is a link** to the in-app repo page (`/$user/repos/$repo`).

## What we built, and what's next

The finished loop: sign in once, click **Embed starred**, watch repos stream into the list, and search them by meaning. It all runs on your machine with a ~200 MB model.

It's deliberately "retrieval only": the answer is a ranked list of your own repos, not generated text. That keeps it fast, obviously correct (every result is a real star), and free of a second, much larger model.

Natural next steps, roughly in order of payoff:

1. **Filters** on language, topic, or owner, as a `WHERE` next to the vector sort.
2. **Hybrid ranking**: blend in Postgres full-text search, so exact names ("tokio") always rank first.
3. **Chunked READMEs** for deep-content matches (see the note in chapter 3).
4. **An HNSW index** once the corpus outgrows an exact scan.
5. **Optional local generation**: pass the top hits to a small local LLM for a one-paragraph answer that cites them.

## Sign-off: about binary size

I tried hard to keep the shipped binary small:

- **Nothing heavy in the bundle.** ONNX Runtime and the EmbeddingGemma weights are fetched at runtime (the first-run bootstrap above), not packaged.
- **Lazy imports.** The model package is only imported the first time something embeds.
- **No CEF.** `backend: "webview"` uses the OS webview instead of bundling Chromium, which saves roughly 100 MB (chapter 1).

Even so, the Deno runtime alone is about **70 MB**, and that's a floor this approach can't go below. For a tool whose job is "search my stars", that feels like a lot.

I suspect a Go shell with [Wails](https://wails.io/) (a single Go binary using the OS webview) could come in well under that. So I've started learning Go, and I'm looking forward to rebuilding a slice of this and writing up what I find.
