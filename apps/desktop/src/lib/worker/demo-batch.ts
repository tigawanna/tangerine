import { Job, Worker } from "@conveyor/core";
import {
  DEMO_BATCH_QUEUE,
  demoBatchQueue,
  store,
  type DemoBatchJob,
} from "@/lib/worker/client";

const DEFAULT_TOTAL = 1000;
const DEFAULT_BATCH_SIZE = 10;
/** Wait after a 429 — must be > 15s. */
const RATE_LIMIT_WAIT_MS = 20_000;
/** Rough chance a single attempt hits 429. */
const RATE_LIMIT_CHANCE = 0.12;

export type ProcessTaskResult =
  | { success: true; status: 200; task: number }
  | { success: false; status: 429; task: number };

export type DemoBatchPhase = "idle" | "running" | "waiting" | "done" | "error";

export type DemoBatchStatus = {
  phase: DemoBatchPhase;
  jobId: string | null;
  total: number;
  completed: number;
  batchSize: number;
  currentChunkStart: number | null;
  currentChunkEnd: number | null;
  lastTask: number | null;
  /** ISO timestamp when the current 429 pause ends. */
  waitingUntil: string | null;
  message: string | null;
  error: string | null;
  updatedAt: string;
};

const idleStatus = (): DemoBatchStatus => ({
  phase: "idle",
  jobId: null,
  total: 0,
  completed: 0,
  batchSize: DEFAULT_BATCH_SIZE,
  currentChunkStart: null,
  currentChunkEnd: null,
  lastTask: null,
  waitingUntil: null,
  message: null,
  error: null,
  updatedAt: new Date().toISOString(),
});

let status: DemoBatchStatus = idleStatus();

function patchStatus(partial: Partial<DemoBatchStatus>): DemoBatchStatus {
  status = {
    ...status,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  return status;
}

/** Latest demo-batch progress (for GET + SSE). */
export function getDemoBatchStatus(): DemoBatchStatus {
  return status;
}

/**
 * Simulated unit of work. Usually 200; sometimes 429 rate-limit.
 */
export function processTask(task: number): ProcessTaskResult {
  if (Math.random() < RATE_LIMIT_CHANCE) {
    return { success: false, status: 429, task };
  }
  return { success: true, status: 200, task };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process `total` items in chunks of `batchSize` (default 1000 / 10).
 */
export async function runDemoBatch(
  jobId: string,
  job: DemoBatchJob,
): Promise<{ processed: number; batchSize: number }> {
  const total = job.total > 0 ? job.total : DEFAULT_TOTAL;
  const batchSize = job.batchSize > 0 ? job.batchSize : DEFAULT_BATCH_SIZE;
  let completed = 0;

  patchStatus({
    phase: "running",
    jobId,
    total,
    completed: 0,
    batchSize,
    currentChunkStart: null,
    currentChunkEnd: null,
    lastTask: null,
    waitingUntil: null,
    message: "Starting…",
    error: null,
  });

  async function processOne(task: number): Promise<void> {
    for (;;) {
      const result = processTask(task);
      if (result.success) {
        console.log(`[demo-batch] task ${task} ok (status ${result.status})`);
        completed += 1;
        patchStatus({
          phase: "running",
          lastTask: task,
          completed,
          waitingUntil: null,
          message: `Task ${task} ok`,
        });
        return;
      }

      const waitingUntil = new Date(Date.now() + RATE_LIMIT_WAIT_MS).toISOString();
      console.log(
        `[demo-batch] task ${task} rate-limited (status ${result.status}); waiting ${RATE_LIMIT_WAIT_MS / 1000}s`,
      );
      patchStatus({
        phase: "waiting",
        lastTask: task,
        waitingUntil,
        message: `Task ${task} rate-limited (429); waiting 20s`,
      });
      await sleep(RATE_LIMIT_WAIT_MS);
    }
  }

  for (let start = 1; start <= total; start += batchSize) {
    const end = Math.min(start + batchSize - 1, total);
    const tasks = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    console.log(`[demo-batch] chunk ${start}–${end} / ${total}`);
    patchStatus({
      phase: "running",
      currentChunkStart: start,
      currentChunkEnd: end,
      waitingUntil: null,
      message: `Processing chunk ${start}–${end}`,
    });
    await Promise.all(tasks.map((task) => processOne(task)));
  }

  patchStatus({
    phase: "done",
    completed: total,
    currentChunkStart: null,
    currentChunkEnd: null,
    waitingUntil: null,
    message: `Finished ${total} tasks`,
  });

  return { processed: total, batchSize };
}

let workerStarted = false;

/** Idempotent — start the demo-batch worker once per process. */
export function ensureDemoBatchWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    DEMO_BATCH_QUEUE,
    async (job: Job<DemoBatchJob>) => {
      console.log(`[demo-batch] job ${job.id} started`, job.data);
      try {
        const result = await runDemoBatch(job.id, job.data);
        console.log(`[demo-batch] job ${job.id} done`, result);
        return result;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Demo batch failed";
        patchStatus({
          phase: "error",
          waitingUntil: null,
          message,
          error: message,
        });
        throw caught;
      }
    },
    { store, concurrency: 1 },
  );
}

/** Enqueue a demo batch and ensure a worker is listening. */
export async function enqueueDemoBatch(
  data: Partial<DemoBatchJob> = {},
): Promise<{ jobId: string; total: number; batchSize: number }> {
  if (status.phase === "running" || status.phase === "waiting") {
    return {
      jobId: status.jobId ?? "in-flight",
      total: status.total,
      batchSize: status.batchSize,
    };
  }

  ensureDemoBatchWorker();

  const payload: DemoBatchJob = {
    total: data.total ?? DEFAULT_TOTAL,
    batchSize: data.batchSize ?? DEFAULT_BATCH_SIZE,
  };

  patchStatus({
    phase: "running",
    jobId: null,
    total: payload.total,
    completed: 0,
    batchSize: payload.batchSize,
    message: "Queued…",
    error: null,
    waitingUntil: null,
  });

  const job = await demoBatchQueue.add("run", payload);
  patchStatus({ jobId: job.id });

  return {
    jobId: job.id,
    total: payload.total,
    batchSize: payload.batchSize,
  };
}
