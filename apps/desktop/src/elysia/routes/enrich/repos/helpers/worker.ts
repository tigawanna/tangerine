import { Job, Worker, type BatchResult } from "@conveyor/core";
import { isGithubRateLimited } from "@repo/github";
import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import { userRepoEmbedStore } from "@/elysia/routes/enrich/repos/helpers/store.ts";
import {
  getUserRepoEmbedActivityStatus,
  maybeMarkUserRepoEmbedDone,
  patchUserRepoEmbedActivity,
  type UserRepoEmbedActivityRepoRow,
} from "@/elysia/routes/enrich/repos/helpers/embed-activity.ts";
import {
  USER_REPO_EMBED_QUEUE,
  type UserRepoEmbedJob,
} from "@/elysia/routes/enrich/repos/helpers/queue.ts";
import { embedRepo, type EmbedRepoResult } from "@/lib/embedding-gemmma/embed-repo.ts";
import { sleep } from "@/lib/sse.ts";

const RATE_LIMIT_PAUSE_MS = 60_000;

/**
 * Persist one user-repo embed result; returns the list-safe row (no vector).
 */
async function upsertUserRepoEmbed(result: EmbedRepoResult): Promise<UserRepoEmbedActivityRepoRow> {
  const [row] = await db
    .insert(projectEnrichmentOutputs)
    .values({
      owner: result.owner,
      name: result.name,
      type: "repos",
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
        type: "repos",
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
    type: row.type === "repos" ? "repos" : null,
    url: `https://github.com/${row.owner}/${row.name}`,
  };
}

function asError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error(String(caught));
}

async function pauseForRateLimit(error: Error): Promise<void> {
  userRepoEmbedWorker.pause();
  patchUserRepoEmbedActivity({
    phase: "waiting",
    list: { rateLimited: true },
    embed: { current: null, lastError: error.message },
    message: `GitHub rate limited — pausing embed for ${RATE_LIMIT_PAUSE_MS / 1000}s`,
  });

  await sleep(RATE_LIMIT_PAUSE_MS);

  userRepoEmbedWorker.resume();
  patchUserRepoEmbedActivity({
    phase: "embedding",
    list: { rateLimited: false },
    message: "Resumed embed after rate-limit pause",
  });
}

export const userRepoEmbedWorker = new Worker<UserRepoEmbedJob>(
  USER_REPO_EMBED_QUEUE,
  async (jobs: Job<UserRepoEmbedJob>[]) => {
    const results: BatchResult[] = [];

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]!;
      const { owner, name } = job.data;
      patchUserRepoEmbedActivity({
        phase: "embedding",
        embed: { current: { owner, name } },
        message: `Embedding ${owner}/${name}`,
      });

      try {
        const embedded = await embedRepo(job.data);
        const row = await upsertUserRepoEmbed(embedded);
        const completed = getUserRepoEmbedActivityStatus().embed.completed + 1;
        patchUserRepoEmbedActivity(
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

          const failed = getUserRepoEmbedActivityStatus().embed.failed + (jobs.length - i);
          patchUserRepoEmbedActivity({
            embed: { failed, lastError: error.message },
            message: `Rate limited on ${owner}/${name} — deferred remaining batch`,
          });
          for (let j = i; j < jobs.length; j++) {
            results.push({ status: "failed", error });
          }
          return results;
        }

        const failed = getUserRepoEmbedActivityStatus().embed.failed + 1;
        patchUserRepoEmbedActivity({
          embed: { current: null, failed, lastError: error.message },
          message: `Failed ${owner}/${name}: ${error.message}`,
        });
        results.push({ status: "failed", error });
      }
    }

    await maybeMarkUserRepoEmbedDone({ ignoreActive: true });
    setTimeout(() => {
      void maybeMarkUserRepoEmbedDone();
    }, 250);
    return results;
  },
  { store: userRepoEmbedStore, batch: { size: 10 }, autoStart: false },
);

userRepoEmbedWorker.on("drained", () => {
  void maybeMarkUserRepoEmbedDone();
});
