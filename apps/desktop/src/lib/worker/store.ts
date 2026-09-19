import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SqliteStore } from "@conveyor/store-sqlite-node";
import { resolveLocalPath } from "@/db/path";

const filename = resolveLocalPath(
  process.env.QUEUE_DATABASE_PATH ?? process.env.QUEUE_DATABASE_URL,
  "queue.db",
);
mkdirSync(dirname(filename), { recursive: true });

/** Shared Conveyor SQLite store (WAL + migrations on connect). */
export const workerStore = new SqliteStore({ filename });
await workerStore.connect();
