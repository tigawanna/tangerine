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

const store = new SqliteStore({ filename });
await store.connect(); // auto-runs migrations, enables WAL mode
