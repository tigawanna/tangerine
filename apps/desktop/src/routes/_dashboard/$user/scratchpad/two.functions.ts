import { enqueueAllStarredRepos } from "@/elysia/routes/enrich/starred/helpers/enqueue.ts";
import {
  REPO_EMBED_QUEUE,
  starredRepoEmbedQueue,
} from "@/elysia/routes/enrich/starred/helpers/queue.ts";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Kick off a starred-list crawl into the embed queue.
 * Pass the OAuth token in — server-fn splits can duplicate the worker-token
 * module, so enqueue uses `token` directly instead of a process seed alone.
 */
export const enqueueStarredFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(1),
      login: z.string().min(1),
      /** Max GraphQL pages this run; omit for a full crawl. */
      pages: z.number().int().min(1).max(50).optional(),
      after: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    return enqueueAllStarredRepos({
      login: data.login,
      token: data.token,
      pages: data.pages,
      after: data.after,
    });
  });

/** Snapshot of `repo-embed` queue depth — polled every 5s from the client. */
export const getRepoEmbedQueueStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const counts = await starredRepoEmbedQueue.getJobCounts();
  const waiting = await starredRepoEmbedQueue.getJobs("waiting", 0, 8);
  const active = await starredRepoEmbedQueue.getJobs("active", 0, 4);

  return {
    queue: REPO_EMBED_QUEUE,
    counts,
    waitingSample: waiting.map((job) => ({
      id: job.id,
      owner: job.data.owner,
      name: job.data.name,
    })),
    activeSample: active.map((job) => ({
      id: job.id,
      owner: job.data.owner,
      name: job.data.name,
    })),
  };
});
