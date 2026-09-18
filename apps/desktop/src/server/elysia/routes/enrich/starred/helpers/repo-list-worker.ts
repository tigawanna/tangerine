import { Job, Queue, Worker } from "@conveyor/core";
import { createGitHubClient } from "@repo/github";
import {
  getGithubToken,
  rememberGithubTokenForWorkers,
} from "@/lib/github-token.server.ts";
import { workerStore } from "@/lib/worker/store.ts";
import {
  getEmbedActivityStatus,
  patchEmbedActivity,
  resetEmbedActivity,
} from "@/server/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { getStarredRepos } from "@/server/elysia/routes/enrich/starred/helpers/fetchers.ts";
import { ensureRepoEmbedWorker } from "@/server/elysia/routes/enrich/starred/helpers/process-repo.ts";
import {
  DEFAULT_REPO_EMBED_LIMIT,
  enqueueRepoEmbedJobs,
} from "@/server/elysia/routes/enrich/starred/helpers/repo-worker.ts";

export const REPO_EMBED_LIST_QUEUE = "repo-embed-list";
export const REPO_EMBED_LIST_JOB = "fetch-starred-page";

/** Inbound payload for one list-page job. */
export type RepoEmbedListJob = {
  login: string;
  /** GraphQL `after` cursor; `null` = first page. */
  after: string | null;
  pageSize: number;
};

export const repoEmbedListQueue = new Queue<RepoEmbedListJob>(REPO_EMBED_LIST_QUEUE, {
  store: workerStore,
});

let listWorkerStarted = false;

/** Idempotent — start the list worker once per process. */
export function ensureRepoEmbedListWorker(): void {
  if (listWorkerStarted) return;
  listWorkerStarted = true;

  new Worker<RepoEmbedListJob>(
    REPO_EMBED_LIST_QUEUE,
    async (job: Job<RepoEmbedListJob>) => {
      const { login, after, pageSize } = job.data;
      const before = getEmbedActivityStatus();

      patchEmbedActivity({
        phase: "listing",
        login,
        list: { after, rateLimited: false },
        message: `Fetching starred page (after=${after ?? "start"})`,
      });

      const result = await getStarredRepos({ login, after, pageSize });

      if (result.error === "429") {
        patchEmbedActivity({
          phase: "waiting",
          list: { rateLimited: true },
          message: "GitHub rate limited — retrying list page in 60s",
        });
        await repoEmbedListQueue.schedule("60s", REPO_EMBED_LIST_JOB, job.data);
        return { rateLimited: true };
      }

      const { repos, nextCursor, hasNextPage, totalCount } = result.data;
      const { enqueued } = await enqueueRepoEmbedJobs(repos);

      patchEmbedActivity({
        list: {
          after: nextCursor,
          fetchedTotal: before.list.fetchedTotal + repos.length,
          enqueuedTotal: before.list.enqueuedTotal + enqueued,
          totalCount,
          rateLimited: false,
        },
        message: hasNextPage
          ? `Listed ${repos.length} repos; next page queued`
          : `List done — ${before.list.fetchedTotal + repos.length} repos`,
        phase: hasNextPage ? "listing" : "embedding",
      });

      if (hasNextPage && nextCursor) {
        await repoEmbedListQueue.schedule("2s", REPO_EMBED_LIST_JOB, {
          login,
          after: nextCursor,
          pageSize,
        });
      } else {
        patchEmbedActivity({
          phase: "embedding",
          message: "Starred list crawl finished — embedding queued repos",
        });
      }

      return {
        fetched: repos.length,
        enqueued,
        done: !hasNextPage,
        totalCount,
      };
    },
    { store: workerStore, concurrency: 1 },
  );
}

/** Kick off the crawl from the first page of the signed-in viewer's stars. */
export async function enqueueRepoEmbedListJob(options: { pageSize?: number } = {}) {
  const token = await getGithubToken();
  rememberGithubTokenForWorkers(token);

  ensureRepoEmbedListWorker();
  ensureRepoEmbedWorker();

  const viewer = await createGitHubClient(token).getViewer();
  const pageSize = Math.min(options.pageSize ?? DEFAULT_REPO_EMBED_LIMIT, 100);

  resetEmbedActivity(viewer.login);

  const job = await repoEmbedListQueue.add(REPO_EMBED_LIST_JOB, {
    login: viewer.login,
    after: null,
    pageSize,
  });

  return { jobId: job.id, login: viewer.login, pageSize };
}
