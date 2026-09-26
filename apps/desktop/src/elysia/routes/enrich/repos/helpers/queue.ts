import { userRepoEmbedStore } from "@/elysia/routes/enrich/repos/helpers/store.ts";
import { Queue } from "@conveyor/core";
import type { EmbedRepoShape } from "@/lib/embedding-gemmma/embed-repo.ts";

/** Job name written to every user-repo embed queue entry. */
export const USER_REPO_EMBED_JOB_NAME = "embed-user-repo";

export const USER_REPO_EMBED_QUEUE = "user-repo-embed";

/** Default page size when enqueueing a user's repos (GitHub max / “top 100”). */
export const DEFAULT_USER_REPO_EMBED_LIMIT = 100;

/** Inbound payload for one user-repo embed job (`job.data`). */
export type UserRepoEmbedJob = EmbedRepoShape;

/** Producer queue — import this to enqueue per-repo embed jobs. */
export const userRepoEmbedQueue = new Queue<UserRepoEmbedJob>(USER_REPO_EMBED_QUEUE, {
  store: userRepoEmbedStore,
});

export const enqueueUserRepoEmbedJobs = async (jobs: UserRepoEmbedJob[]) => {
  const created = await userRepoEmbedQueue.addBulk(
    jobs.map((job) => ({
      name: USER_REPO_EMBED_JOB_NAME,
      data: job,
      opts: {
        deduplication: { key: `user-repo-embed:${job.id}` },
        attempts: 5,
        backoff: { type: "exponential", delay: 60_000 },
      },
    })),
  );
  return { enqueued: created.length, jobIds: created.map((job) => job.id) };
};
