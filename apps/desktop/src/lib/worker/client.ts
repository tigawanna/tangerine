import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Queue } from "@conveyor/core";
import { SqliteStore } from "@conveyor/store-sqlite-node";
import { resolvePath } from "@/db/path";

const filename = resolvePath({
  override: process.env.QUEUE_DATABASE_PATH,
  url: process.env.QUEUE_DATABASE_URL,
  defaultFile: "queue.db",
});
mkdirSync(dirname(filename), { recursive: true });

/** Shared Conveyor SQLite store (WAL + migrations on connect). */
export const store = new SqliteStore({ filename });
await store.connect();

export type DemoBatchJob = {
  /** Total items to process (default 1000). */
  total: number;
  /** Concurrent chunk size (default 10). */
  batchSize: number;
};

export const DEMO_BATCH_QUEUE = "demo-batch";

/** Producer queue — import this to enqueue jobs. */
export const demoBatchQueue = new Queue<DemoBatchJob>(DEMO_BATCH_QUEUE, { store });
