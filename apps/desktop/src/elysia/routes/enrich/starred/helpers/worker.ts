import { Job, Worker } from "@conveyor/core";
import { starredRepoEmbedStore } from "@/elysia/routes/enrich/starred/helpers/store.ts";
import {
  REPO_EMBED_QUEUE,
  type StarredRepoEmbedJob,
} from "@/elysia/routes/enrich/starred/helpers/queue.ts";

export const starredRepoEmbedWorker = new Worker<StarredRepoEmbedJob>(
  REPO_EMBED_QUEUE,
  async (jobs: Job<StarredRepoEmbedJob>[]) => {
    for (const job of jobs) {
      console.log("starred worker processing job ==", job.data);
    }
    return jobs.map(() => ({ status: "completed" as const }));
  },
  { store: starredRepoEmbedStore, batch: { size: 10 }, autoStart: false },
);
