import { workerStore } from "@/lib/worker/store.ts";
import { Queue } from "@conveyor/core";

export const REPO_EMBED_LIST_QUEUE = "repo-embed-list";

/** Inbound payload for one list-page job. */
export type RepoEmbedListJob = {
  /** Viewer login (stable across pages). */
  login: string;
  /** GraphQL `after` cursor; `null` = first page. */
  after: string | null;
  /** Page size (GitHub max 100). */
  pageSize: number;
};

export type StartStarredRepoEmbedListResult = {
  started: boolean;
  reason: "started" | "already-running";
  login: string;
  jobId: string | null;
  pageSize: number;
};

export type ProcessStarredPageResult = {
  fetched: number;
  enqueued: number;
  done: boolean;
  rateLimited?: boolean;
  nextAfter?: string | null;
  totalCount?: number;
};

/** Producer queue for starred-list pagination. */
export const repoEmbedListQueue = new Queue<RepoEmbedListJob>(REPO_EMBED_LIST_QUEUE, {
  store: workerStore,
});


export async function enqueueRepoEmbedListJob() {
//  const repos = await getStarredRepos();
}
