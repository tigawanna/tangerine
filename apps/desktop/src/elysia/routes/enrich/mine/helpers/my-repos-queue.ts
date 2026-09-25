import { getMyRepos } from "@/elysia/routes/enrich/mine/helpers/fetcher.ts";
import { workerStore } from "@/lib/worker/store.ts";
import { Queue } from "@conveyor/core";
import { isGithubRateLimited } from "@repo/github";

const MINE_REPOS_QUEUE = "mine-repos";
const MINE_REPOS_JOB = "mine-repos";

export type MineReposJob = {
  owner: string;
  name: string;
};

export const mineReposQueue = new Queue<MineReposJob>(MINE_REPOS_QUEUE, {
  store: workerStore,
});

interface EnqueueMineReposJobprops {
  after?: string;
}
export async function enqueueMineReposJob({ after }: EnqueueMineReposJobprops) {
  try {
    const response = await getMyRepos({ after });
    const repos = response.data?.repos ?? [];
    if (!repos) {
      return { data: null, error: "No repos found" };
    }
    for (const repo of repos) {
      await mineReposQueue.add(MINE_REPOS_JOB, {
        owner: repo.owner.login,
        name: repo.name ?? "",
      });
    }
    return { data: repos.length, error: null };
  } catch (error) {
    if (isGithubRateLimited(error)) {
      return { data: null, error: "429" as const };
    }
    return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


