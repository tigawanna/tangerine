import { Queue } from "@conveyor/core";
import { workerStore } from "@/lib/worker/store.ts";
import { isGithubRateLimited } from "@repo/github";
import { getMyRepos } from "@/elysia/routes/enrich/mine/helpers/fetcher.ts";

const MINE_REPOS_QUEUE = "mine-repos";
const MINE_REPOS_JOB = "mine-repos";

export type MineReposJob = {
  owner: string;
  name: string;
  
};

export const mineReposQueue = new Queue<MineReposJob>(MINE_REPOS_QUEUE, {
  store: workerStore,
});

export async function enqueueMineReposJob() {
try{
  const repos = await getMyRepos({});
}catch(error){
  if (isGithubRateLimited(error)) {
    return { data: null, error: "429" as const };
  }
  return { data: null, error: error instanceof Error ? error.message : "Unknown error" };
}
}

export function dequeueMineReposJob() {
  
}
