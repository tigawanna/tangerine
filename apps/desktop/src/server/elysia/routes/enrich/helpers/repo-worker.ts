import { Queue } from "@conveyor/core";
import { workerStore } from "@/lib/worker/store.ts";

/** Job name written to every repo-embed queue entry. */
export const REPO_EMBED_JOB_NAME = "embed-repo";

export const REPO_EMBED_QUEUE = "repo-embed";

/** Default page size when enqueueing the viewer's starred list. */
export const DEFAULT_REPO_EMBED_LIMIT = 100;

/** Inbound payload for one repo-embed job (`job.data`). */
export type RepoEmbedJob = {
  /** GitHub GraphQL node id. */
  repoId: string;
  /** Repo owner login. */
  owner: string;
  /** Repo name (without owner). */
  name: string;
  /** Repo description, if any. */
  description: string | null;
  /** Canonical GitHub HTML URL. */
  url: string;
  /** Top languages from the card query (may be empty). */
  languages: string[];
};

/** Producer queue — import this to enqueue per-repo embed jobs. */
export const repoEmbedQueue = new Queue<RepoEmbedJob>(REPO_EMBED_QUEUE, {
  store: workerStore,
});

/**
 * Enqueues already-built repo-embed jobs (one queue row per repo).
 * Dedupes by `repoId` so re-running enqueue does not pile duplicates while a job is live.
 */
export async function enqueueRepoEmbedJobs(
  jobs: RepoEmbedJob[],
): Promise<{ enqueued: number; jobIds: string[] }> {
  if (jobs.length === 0) {
    return { enqueued: 0, jobIds: [] };
  }

  const created = await repoEmbedQueue.addBulk(
    jobs.map((data) => ({
      name: REPO_EMBED_JOB_NAME,
      data,
      opts: {
        deduplication: { key: `repo-embed:${data.repoId}` },
      },
    })),
  );

  return {
    enqueued: created.length,
    jobIds: created.map((job) => job.id),
  };
}
