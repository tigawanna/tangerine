import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { resolveDatabaseUrl } from "./path";
import * as schema from "./schema";

/**
 * Ensure the parent dir exists before opening a local `file:` database.
 * No-op for remote `libsql://` / `:memory:` URLs.
 */
function ensureLocalDbParent(url: string): void {
  if (!url.startsWith("file:")) return;
  mkdirSync(dirname(url.slice("file:".length)), { recursive: true });
}

const url = resolveDatabaseUrl({
  override: process.env.DATABASE_URL,
});
ensureLocalDbParent(url);

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

/** Embedded Turso/libSQL DB (vector-capable). Not better-sqlite3. */
export const db = drizzle(client, { schema });

export type DesktopDatabase = typeof db;

export { client as libsqlClient };
