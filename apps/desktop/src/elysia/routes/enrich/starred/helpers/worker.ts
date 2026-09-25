import { Job, Worker, type BatchResult } from "@conveyor/core";
import { isGithubRateLimited } from "@repo/github";
import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import { starredRepoEmbedStore } from "@/elysia/routes/enrich/starred/helpers/store.ts";
import {
  getEmbedActivityStatus,
  patchEmbedActivity,
  type EmbedActivityRepoRow,
} from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import {
  REPO_EMBED_QUEUE,
  type StarredRepoEmbedJob,
} from "@/elysia/routes/enrich/starred/helpers/queue.ts";
import { embedRepo, type EmbedRepoResult } from "@/lib/embedding-gemmma/embed-repo.ts";
import { sleep } from "@/lib/sse.ts";

/** Pause duration after a GitHub 429 so the rest of the batch does not hammer the limit. */
const RATE_LIMIT_PAUSE_MS = 60_000;

/**
 * Persist one starred embed result; returns the list-safe row (no vector).
 */
async function upsertStarredEmbed(result: EmbedRepoResult): Promise<EmbedActivityRepoRow> {
  const [row] = await db
    .insert(projectEnrichmentOutputs)
    .values({
      owner: result.owner,
      name: result.name,
      type: "starred",
      description: result.description,
      summary: result.summary,
      sourceGeneration: 1,
      payload: { text: result.text },
      modelId: result.modelId,
      embedding: result.embedding,
      embeddedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [projectEnrichmentOutputs.owner, projectEnrichmentOutputs.name],
      set: {
        type: "starred",
        description: result.description,
        summary: result.summary,
        payload: { text: result.text },
        modelId: result.modelId,
        embedding: result.embedding,
        embeddedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({
      id: projectEnrichmentOutputs.id,
      owner: projectEnrichmentOutputs.owner,
      name: projectEnrichmentOutputs.name,
      type: projectEnrichmentOutputs.type,
      description: projectEnrichmentOutputs.description,
      summary: projectEnrichmentOutputs.summary,
      sourceGeneration: projectEnrichmentOutputs.sourceGeneration,
      payload: projectEnrichmentOutputs.payload,
      modelId: projectEnrichmentOutputs.modelId,
      embeddedAt: projectEnrichmentOutputs.embeddedAt,
      createdAt: projectEnrichmentOutputs.createdAt,
    });

  return {
    ...row,
    type: row.type === "starred" ? "starred" : null,
    url: `https://github.com/${row.owner}/${row.name}`,
  };
}

function asError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error(String(caught));
}

/**
 * Pause polling, wait out the rate-limit window, then resume.
 * Remaining jobs in this batch are failed (no more GitHub calls) so Conveyor can retry later.
 */
async function pauseForRateLimit(error: Error): Promise<void> {
  starredRepoEmbedWorker.pause();
  patchEmbedActivity({
    phase: "waiting",
    list: { rateLimited: true },
    embed: { current: null, lastError: error.message },
    message: `GitHub rate limited — pausing embed for ${RATE_LIMIT_PAUSE_MS / 1000}s`,
  });

  await sleep(RATE_LIMIT_PAUSE_MS);

  starredRepoEmbedWorker.resume();
  patchEmbedActivity({
    phase: "embedding",
    list: { rateLimited: false },
    message: "Resumed embed after rate-limit pause",
  });
}

export const starredRepoEmbedWorker = new Worker<StarredRepoEmbedJob>(
  REPO_EMBED_QUEUE,
  async (jobs: Job<StarredRepoEmbedJob>[]) => {
    const results: BatchResult[] = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]!;
      const { owner, name } = job.data;
      patchEmbedActivity({
        phase: "embedding",
        embed: { current: { owner, name } },
        message: `Embedding ${owner}/${name}`,
      });

      try {
        const embedded = await embedRepo(job.data);
        const row = await upsertStarredEmbed(embedded);
        const completed = getEmbedActivityStatus().embed.completed + 1;
        patchEmbedActivity(
          {
            phase: "embedding",
            embed: { current: null, completed, lastError: null },
            message: `Embedded ${owner}/${name}`,
          },
          row,
        );
        results.push({ status: "completed", value: { owner, name } });
      } catch (caught: unknown) {
        const error = asError(caught);

        if (isGithubRateLimited(caught)) {
          await pauseForRateLimit(error);

          // Fail this job + every remaining job in the batch without further API calls.
          const failed = getEmbedActivityStatus().embed.failed + (jobs.length - i);
          patchEmbedActivity({
            embed: { failed, lastError: error.message },
            message: `Rate limited on ${owner}/${name} — deferred remaining batch`,
          });
          for (let j = i; j < jobs.length; j++) {
            results.push({ status: "failed", error });
          }
          return results;
        }

        const failed = getEmbedActivityStatus().embed.failed + 1;
        patchEmbedActivity({
          embed: { current: null, failed, lastError: error.message },
          message: `Failed ${owner}/${name}: ${error.message}`,
        });
        results.push({ status: "failed", error });
      }
    }

    return results;
  },
  { store: starredRepoEmbedStore, batch: { size: 10 }, autoStart: false },
);
