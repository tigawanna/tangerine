# Chapter 3: Worker / processing engine

[Series index](./README.md) · Prev: [Chapter 2](./02-better-auth.md) · Next: [Chapter 4: Live activity bus](./04-live-activity-bus.md)

## Goal

Turn a star list into an embedded corpus: paced GitHub fetches, local **EmbeddingGemma** embeddings, and upserts into the local vector store, without burning the GitHub API rate limit.

## Why a worker

Embedding a few hundred starred repos means a few hundred README fetches and a few hundred model runs. That takes minutes, can hit GitHub's rate limit halfway through, and shouldn't die if the user navigates away or quits the app. So the HTTP request only **kicks things off**, and a background worker does the rest:

```text
POST /enrich/starred/run
   |
   +--> worker.start()
   |
   +--> enqueueAllStarredRepos()      GitHub GraphQL, one page of stars at a time
            |
            v
     +------------------+
     | queue (SQLite)   |   one job per repo, deduped by repo id
     +------------------+
            |
            v  batches of 10
     Worker: fetch README -> build text -> EmbeddingGemma -> upsert into PGlite
            |
            +--> patchEmbedActivity()  --> pub/sub --> SSE (chapter 4)
```

## The engine: Conveyor + SQLite

We use [Conveyor](https://jsr.io/@conveyor/core), a job queue with a BullMQ-style API (`Queue`, `Worker`, retries with backoff, deduplication, pause/resume, batch processing) and pluggable stores. We use the SQLite store (`@conveyor/store-sqlite-node`), so the queue is just a file under `~/.config/tangerine-desktop/queues/`.

That fits the app: one Deno process on one machine. There's no Redis to run, jobs survive restarts because they're on disk, and the whole engine lives in the same process as the UI server and the model.

Each queue gets its own SQLite file ([`src/lib/worker/store.ts`](../../src/lib/worker/store.ts)):

```ts
export function createWorkerStore(options: { name: string }) {
  const filename = resolveLocalPath(
    process.env.QUEUE_DATABASE_PATH ?? process.env.QUEUE_DATABASE_URL,
    `queues/${options.name}.db`,
  );
  mkdirSync(dirname(filename), { recursive: true });
  return new SqliteStore({ filename });
}
```

```ts
// src/elysia/routes/enrich/starred/helpers/store.ts
export const starredRepoEmbedStore = createWorkerStore({ name: "starred-repo-embed" });
await starredRepoEmbedStore.connect();
```

## Stage 1: the queue and its jobs

One job per repo. The payload is just what we already got from the stars list, so the worker doesn't need to re-fetch metadata ([`queue.ts`](../../src/elysia/routes/enrich/starred/helpers/queue.ts)):

```ts
export interface EmbedRepoShape {
  id: string;
  owner: string;
  name: string;
  description: string | null;
  languages: string[];
  tags: string[];
}

export const starredRepoEmbedQueue = new Queue<StarredRepoEmbedJob>("repo-embed", {
  store: starredRepoEmbedStore,
});

export const enqueueStarredRepoEmbedJobs = async (jobs: StarredRepoEmbedJob[]) => {
  const created = await starredRepoEmbedQueue.addBulk(
    jobs.map((job) => ({
      name: "embed-repo",
      data: job,
      opts: {
        deduplication: { key: `repo-embed:${job.id}` },
        attempts: 5,
        backoff: { type: "exponential", delay: 60_000 },
      },
    })),
  );
  return { enqueued: created.length, jobIds: created.map((job) => job.id) };
};
```

- **The dedup key** is the GitHub node id, so re-running the crawl doesn't queue the same repo twice.
- **`attempts` + exponential backoff** is how rate-limited jobs come back later on their own (stage 4).

## Stage 2: page through the stars

[`enqueue.ts`](../../src/elysia/routes/enrich/starred/helpers/enqueue.ts) fetches one GraphQL page (up to 100 stars), hands it to the queue, and moves on to the next cursor. It never holds the whole star list in memory, because the queue owns the payload from here on:

```ts
const page = await client.getUserStarredReposMinimal({ login, first: pageSize, after });
if (!page) return { data: "crawl-done", error: null };

await enqueueStarredRepoEmbedJobs(
  page.edges.map(({ node }) => ({
    id: node.id,
    owner: node.owner.login,
    name: node.name,
    description: node.description,
    tags: node.tags,
    languages: node.tags,
  })),
);

const { hasNextPage, endCursor } = page.pageInfo;
if (!hasNextPage || !endCursor) return { data: "crawl-done", error: null };
if (pagesLeft !== undefined && pagesLeft <= 1) return { data: { nextCursor: endCursor }, error: null };

return enqueueAllStarredRepos({ ...input, after: endCursor, pages: pagesLeft && pagesLeft - 1 });
```

Two knobs make it easy to try on a small slice first:

- **`pages`** caps how many pages this run fetches. The result hands back `nextCursor` so a later run can resume from there.
- **`after`** starts from a saved cursor.

If GitHub rate-limits the list call itself, the same page is retried with exponential backoff (1 min, 2 min, 4 min, capped at 15) up to five times:

```ts
} catch (caught) {
  if (!isGithubRateLimited(caught)) throw caught;
  if (retriesLeft <= 0) return { data: null, error: "429" };

  const attempt = MAX_RATE_LIMIT_RETRIES - retriesLeft;
  await sleep(Math.min(60_000 * 2 ** attempt, 15 * 60_000));
  return enqueueAllStarredRepos({ ...input, retriesLeft: retriesLeft - 1 });
}
```

## Stage 3: build the document and embed it

For each repo, [`src/lib/embedding-gemmma/embed-repo.ts`](../../src/lib/embedding-gemmma/embed-repo.ts) fetches the README, keeps the first 20 lines, and builds one short text document:

```ts
export function buildRepoEmbedDocument(repo: EmbedRepoShape, readmeSummary: string | null): string {
  const parts = [
    `Repository: ${repo.name}`,
    `Full name: ${repo.owner}/${repo.name}`,
    repo.description ? `Description: ${repo.description}` : null,
    repo.languages.length > 0 ? `Languages: ${repo.languages.join(", ")}` : null,
    repo.tags.length > 0 ? `Tags: ${repo.tags.join(", ")}` : null,
    readmeSummary ? `README:\n${readmeSummary}` : null,
  ];
  return parts.filter(Boolean).join("\n").slice(0, EMBED_TEXT_MAX_CHARS);
}
```

Then it embeds that document with EmbeddingGemma in **document mode** (chapter 5 covers the model and why the mode matters):

```ts
export async function embedRepo(repo: EmbedRepoShape): Promise<EmbedRepoResult> {
  const client = createGitHubClient(await getGithubToken());
  const readme = await client.getRepoReadme(repo.owner, repo.name);
  const summary = clipReadmeSummary(readme?.content); // first 20 lines
  const text = buildRepoEmbedDocument(repo, summary);

  await ensureOrtReady();
  const { embedDocument, getEmbeddingModelId, getServerGemmaEmbedding } =
    await import("@repo/gemma-embedding/node");
  await getServerGemmaEmbedding({ dtype: readGemmaPrefs().dtype });
  const vector = await embedDocument(text);

  return { ...repo, summary, text, modelId: getEmbeddingModelId(), embedding: Array.from(vector) };
}
```

**One vector per repo, no chunking.** Metadata plus the top of the README tells you what a repo *is*, which is what "find that starred repo about X" needs, and it fits comfortably in EmbeddingGemma's 2K-token context. The tradeoff is that something mentioned only deep in a README won't match. A chunk table is the natural next step if that ever matters.

A repo with no README still gets embedded from its name, description, and topics.

## Stage 4: the worker

[`worker.ts`](../../src/elysia/routes/enrich/starred/helpers/worker.ts) pulls **batches of 10** and handles each job on its own, so one bad repo doesn't fail the batch:

```ts
export const starredRepoEmbedWorker = new Worker<StarredRepoEmbedJob>(
  "repo-embed",
  async (jobs) => {
    const results: BatchResult[] = [];

    for (let i = 0; i < jobs.length; i++) {
      const { owner, name } = jobs[i]!.data;
      patchEmbedActivity({ phase: "embedding", embed: { current: { owner, name } } });

      try {
        const embedded = await embedRepo(jobs[i]!.data);
        const row = await upsertStarredEmbed(embedded); // PGlite, no vector in the returned row
        const completed = getEmbedActivityStatus().embed.completed + 1;
        patchEmbedActivity({ embed: { current: null, completed } }, row);
        results.push({ status: "completed", value: { owner, name } });
      } catch (caught) {
        if (isGithubRateLimited(caught)) {
          await pauseForRateLimit(asError(caught));
          for (let j = i; j < jobs.length; j++) results.push({ status: "failed", error: asError(caught) });
          return results;
        }
        results.push({ status: "failed", error: asError(caught) });
      }
    }
    return results;
  },
  { store: starredRepoEmbedStore, batch: { size: 10 }, autoStart: false },
);
```

The upsert is keyed on `(owner, name)`, so re-embedding a repo replaces its row instead of duplicating it:

```ts
await db
  .insert(projectEnrichmentOutputs)
  .values({ owner, name, type: "starred", description, summary, payload: { text }, modelId, embedding, embeddedAt: new Date() })
  .onConflictDoUpdate({
    target: [projectEnrichmentOutputs.owner, projectEnrichmentOutputs.name],
    set: { description, summary, payload: { text }, modelId, embedding, embeddedAt: new Date() },
  });
```

`autoStart: false` means the worker only runs when asked. `POST /enrich/starred/run` starts it, and there are `worker/start`, `worker/pause`, and `worker/resume` endpoints for manual control.

## Staying under the rate limit

When a README fetch comes back rate-limited, the worker pauses itself for a minute and fails the **rest of the batch** without touching GitHub again:

```ts
async function pauseForRateLimit(error: Error): Promise<void> {
  starredRepoEmbedWorker.pause();
  patchEmbedActivity({ phase: "waiting", list: { rateLimited: true }, message: "GitHub rate limited — pausing embed for 60s" });

  await sleep(60_000);

  starredRepoEmbedWorker.resume();
  patchEmbedActivity({ phase: "embedding", list: { rateLimited: false }, message: "Resumed embed after rate-limit pause" });
}
```

Those failed jobs aren't lost. Each has `attempts: 5` with exponential backoff from 60 s, so Conveyor schedules them again later. Between the pause and the backoff, a large star list just finishes more slowly instead of hammering the API.

## A GitHub token outside the request

Workers run after the HTTP request that started them has ended, so there are no request headers to read a session from. The kickoff route stores the token for the process ([`src/lib/github-token.server.ts`](../../src/lib/github-token.server.ts)):

```ts
let workerGithubToken: string | null = null;

export function rememberGithubTokenForWorkers(token: string): void {
  workerGithubToken = token.trim() || null;
}

export async function getGithubToken(): Promise<string> {
  // 1. OAuth token from the current request, if any
  // 2. token remembered by the kickoff route
  // 3. GH_PAT from the environment
}
```

On desktop, the UI passes the token from `bindings.getGithubAccessToken()` (chapter 2) in the kickoff body.

## Progress, restarts, and "done"

Every step calls `patchEmbedActivity(...)`. That updates one status object (phase, counters, current repo, last error) and publishes it, together with the freshly upserted row if there is one, on the pub/sub bus. Chapter 4 streams that to the UI.

```ts
export type EmbedActivityStatus = {
  phase: "idle" | "listing" | "embedding" | "waiting" | "done" | "error";
  login: string | null;
  list: { after: string | null; fetchedTotal: number; enqueuedTotal: number; totalCount: number | null; rateLimited: boolean };
  embed: { current: { owner: string; name: string } | null; completed: number; failed: number; lastError: string | null };
  message: string | null;
  updatedAt: string;
};
```

"Done" is derived rather than tracked: once the list crawl has settled and the queue has nothing waiting or delayed, `maybeMarkEmbedDone()` flips the phase. It's called after each batch, when the worker emits `drained`, and on `GET /activity`, so a missed event can't leave the UI stuck on "embedding".

What survives a restart:

| State                   | Where                   | After restart                                      |
| ----------------------- | ----------------------- | -------------------------------------------------- |
| Pending / retrying jobs | Conveyor SQLite file    | Picked up again when the worker starts             |
| Embedded repos          | PGlite                  | Still there, and searchable right away             |
| Progress status         | in memory (`globalThis`) | Resets to `idle`; the next run starts fresh counts |

The status lives on `globalThis` for the same reason as the pub/sub bus: Vite HMR re-evaluates modules, and the worker and the SSE route must keep sharing one object.

## Things to know

- **Embeddings run one at a time** on a single shared model instance on the CPU. That's plenty for a personal star list, and it keeps memory predictable next to the UI.
- **The first embed can trigger a model download** if the bootstrap (chapter 5) hasn't run yet, so the first repo takes noticeably longer.
- **README content past line 20 isn't indexed.** That's deliberate for v1, as described in stage 3.
