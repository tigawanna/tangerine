import { Queue } from "@conveyor/core";
import { workerStore } from "@/lib/worker/store.ts";

const MINE_REPOS_QUEUE = "mine-repos";
const MINE_REPOS_JOB = "mine-repos";

export type MineReposJob = {
  owner: string;
  name: string;
  
};

export const mineReposQueue = new Queue<MineReposJob>(MINE_REPOS_QUEUE, {
  store: workerStore,
});

export function enqueueMineReposJob(job: MineReposJob) {

}

export function dequeueMineReposJob() {
  
}
