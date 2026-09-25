import { starredRepoEmbedStore } from "@/elysia/routes/enrich/starred/helpers/store.ts";
import { Queue } from "@conveyor/core";
import type { EmbedRepoShape } from "@/lib/embedding-gemmma/embed-repo.ts";


/** Job name written to every repo-embed queue entry. */
export const REPO_EMBED_JOB_NAME = "embed-repo";

export const REPO_EMBED_QUEUE = "repo-embed";

/** Default page size when enqueueing the viewer's starred list. */
export const DEFAULT_REPO_EMBED_LIMIT = 100;

/** Inbound payload for one repo-embed job (`job.data`). */
export type StarredRepoEmbedJob = EmbedRepoShape;

/** Producer queue — import this to enqueue per-repo embed jobs. */
export const starredRepoEmbedQueue = new Queue<StarredRepoEmbedJob>(REPO_EMBED_QUEUE, {
  store: starredRepoEmbedStore,
});

export const enqueueStarredRepoEmbedJobs = async (jobs: StarredRepoEmbedJob[]) => {
  const created = await starredRepoEmbedQueue.addBulk(
    jobs.map((job) => ({
      name: REPO_EMBED_JOB_NAME,
      data: job,
      opts: {
        deduplication: { key: `repo-embed:${job.id}` },
        /** Retries after worker 429 pauses so deferred batch jobs come back. */
        attempts: 5,
        backoff: { type: "exponential", delay: 60_000 },
      },
    })),
  );
  return { enqueued: created.length, jobIds: created.map((job) => job.id) };
};
