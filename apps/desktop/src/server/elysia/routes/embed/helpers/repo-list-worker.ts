import { Job, Queue, Worker } from "@conveyor/core";
import { createGitHubClient } from "@repo/github";
import {
  getGithubToken,
  rememberGithubTokenForWorkers,
} from "@/lib/github-token.server.ts";
import { workerStore } from "@/lib/worker/store.ts";
import { isGithubRateLimited } from "@/server/elysia/routes/embed/helpers/github-rate-limit.ts";
import {
  LIST_WORKER_LIMITER,
  PAGE_GAP_DELAY,
  RATE_LIMIT_DELAY,
  REPO_EMBED_LIST_JOB_NAME,
  REPO_EMBED_LIST_QUEUE,
} from "@/server/elysia/routes/embed/helpers/repo-list-constants.ts";
import {
  listDedupKey,
  mapStarredNodesToJobs,
} from "@/server/elysia/routes/embed/helpers/repo-list-map.ts";
import {
  DEFAULT_REPO_EMBED_LIMIT,
  enqueueRepoEmbedJobs,
} from "@/server/elysia/routes/embed/helpers/repo-worker.ts";

export {
  REPO_EMBED_LIST_JOB_NAME,
  REPO_EMBED_LIST_QUEUE,
} from "@/server/elysia/routes/embed/helpers/repo-list-constants.ts";
export { isGithubRateLimited } from "@/server/elysia/routes/embed/helpers/github-rate-limit.ts";

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

// let listWorkerStarted = false;

// /**
//  * Fetches one starred page, enqueues embed jobs, then schedules the next page (or retries on 429).
//  */
// export async function processStarredRepoListPage(
//   job: Job<RepoEmbedListJob>,
// ): Promise<ProcessStarredPageResult> {
//   const { login, after, pageSize } = job.data;
//   const client = createGitHubClient(await getGithubToken());

//   try {
//     const page = await client.getUserStarredRepos({
//       login,
//       first: pageSize,
//       after: after ?? undefined,
//     });

//     if (!page) {
//       return { fetched: 0, enqueued: 0, done: true };
//     }

//     const jobs = mapStarredNodesToJobs(page.edges);
//     const { enqueued } = await enqueueRepoEmbedJobs(jobs);

//     const nextAfter = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
//     if (nextAfter) {
//       await repoEmbedListQueue.schedule(
//         PAGE_GAP_DELAY,
//         REPO_EMBED_LIST_JOB_NAME,
//         { login, after: nextAfter, pageSize },
//         { deduplication: { key: listDedupKey(login, nextAfter) } },
//       );

//       return {
//         fetched: jobs.length,
//         enqueued,
//         done: false,
//         nextAfter,
//         totalCount: page.totalCount,
//       };
//     }

//     return {
//       fetched: jobs.length,
//       enqueued,
//       done: true,
//       totalCount: page.totalCount,
//     };
//   } catch (caught) {
//     if (!isGithubRateLimited(caught)) {
//       throw caught;
//     }

//     console.warn(
//       `[repo-embed-list] rate-limited on ${login} after=${after ?? "start"}; retry in ${RATE_LIMIT_DELAY}`,
//     );

//     await repoEmbedListQueue.schedule(RATE_LIMIT_DELAY, REPO_EMBED_LIST_JOB_NAME, job.data, {
//       deduplication: { key: listDedupKey(login, after) },
//     });

//     return { fetched: 0, enqueued: 0, done: false, rateLimited: true, nextAfter: after };
//   }
// }

// /** Idempotent — start the list worker once per process. */
// export function ensureRepoEmbedListWorker(): void {
//   if (listWorkerStarted) return;
//   listWorkerStarted = true;

//   new Worker(
//     REPO_EMBED_LIST_QUEUE,
//     async (job: Job<RepoEmbedListJob>) => {
//       console.log(`[repo-embed-list] job ${job.id}`, job.data);
//       const result = await processStarredRepoListPage(job);
//       console.log(`[repo-embed-list] job ${job.id} done`, result);
//       return result;
//     },
//     {
//       store: workerStore,
//       concurrency: 1,
//       limiter: LIST_WORKER_LIMITER,
//     },
//   );
// }

// /**
//  * Kicks off a durable starred-list crawl: worker pages GitHub and enqueues embed jobs.
//  * Safe to call again while a crawl is in-flight — returns `already-running`.
//  */
// export async function startStarredRepoEmbedList(
//   options: { pageSize?: number } = {},
// ): Promise<StartStarredRepoEmbedListResult> {
//   const pageSize =
//     options.pageSize && options.pageSize > 0
//       ? Math.min(options.pageSize, 100)
//       : DEFAULT_REPO_EMBED_LIMIT;

//   const token = await getGithubToken();
//   rememberGithubTokenForWorkers(token);

//   ensureRepoEmbedListWorker();

//   const client = createGitHubClient(token);
//   const viewer = await client.getViewer();
//   const login = viewer.login;

//   const counts = await repoEmbedListQueue.getJobCounts();
//   const inFlight = counts.waiting + counts.active + counts.delayed;
//   if (inFlight > 0) {
//     return {
//       started: false,
//       reason: "already-running",
//       login,
//       jobId: null,
//       pageSize,
//     };
//   }

//   const job = await repoEmbedListQueue.add(
//     REPO_EMBED_LIST_JOB_NAME,
//     { login, after: null, pageSize },
//     { deduplication: { key: listDedupKey(login, null) } },
//   );

//   return {
//     started: true,
//     reason: "started",
//     login,
//     jobId: job.id,
//     pageSize,
//   };
// }
