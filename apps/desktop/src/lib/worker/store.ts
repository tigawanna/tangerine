import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SqliteStore } from "@conveyor/store-sqlite-node";
import { resolvePath } from "@/db/path";

const filename = resolvePath({
  override: process.env.QUEUE_DATABASE_PATH,
  url: process.env.QUEUE_DATABASE_URL,
  defaultFile: "queue.db",
});
mkdirSync(dirname(filename), { recursive: true });

/** Shared Conveyor SQLite store (WAL + migrations on connect). */
export const workerStore = new SqliteStore({ filename });
await workerStore.connect();
