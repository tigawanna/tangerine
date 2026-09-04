# GitHub repository sync → Payload Jobs Queue

**Goal:** Readable, durable GitHub → Payload sync without handmade Turso retries or a giant sync function. **The queue owns pacing and isolation between repos.**

**Docs:** see `apps/web/src/jobs/README.md` and [Payload Jobs](https://payloadcms.com/docs/jobs-queue/overview).

---

## Six steps

### 1. Enable Payload Jobs + tear down Workflow SDK scaffold — ✅

### 2. Extract domain helpers — ✅

- `list-github-repos.ts`, `map-enrichment-fields.ts`, `repository-category.ts`
- `lastEnrichedAt` + migrate script (see `apps/web/SCRIPTS.md`)

### 3. Task: list + upsert metadata + enqueue enrich jobs — ✅

- `listAndUpsertRepos` upserts metadata and queues staggered `enrichRepo` (`waitUntil` +5m × index)

### 4. Enrich as workflow + rate limits — ✅

- Workflow `enrichRepo`: `fetchArtifacts` → `writeEnrichment`
- 429 → re-queue enrich with `waitUntil + 20m`
- Runner: `limit: 1` on `github-enrich`

### 5. Wire triggers — ✅

- Weekly cron: `/api/cron/sync-repositories` → queue + run metadata
- Every 5m: `/api/payload-jobs/run?queue=github-enrich&limit=1`
- Admin **Pull from GitHub** → same queue + run; toast job id

### 6. Cleanup + observability — ✅

- Removed legacy `syncRepositoriesFromGithub` / `withDbRetry`
- `apps/web/src/jobs/README.md`

---

## Defaults

| Choice           | Value                                   |
| ---------------- | --------------------------------------- |
| Enrich pacing    | `waitUntil` +5m × index; run `limit: 1` |
| Enrich shape     | Workflow: fetch → write                 |
| 429              | Re-queue +20m                           |
| Metadata cadence | Weekly (Monday 06:00 UTC)               |
| Enrich runner    | Every 5 minutes                         |
| Skip field       | `lastEnrichedAt`                        |
| Batch            | Pinned + recent `100`                   |

**Status:** All six steps done.
