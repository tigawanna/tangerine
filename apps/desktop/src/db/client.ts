import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { defaultDatabaseUrl, desktopConfigDir } from "./path";
import * as schema from "./schema";

/**
 * Ensure the config dir exists before opening a `file:` database.
 * No-op for remote `libsql://` / `:memory:` URLs.
 */
function ensureLocalDbParent(url: string): void {
  if (!url.startsWith("file:")) return;
  const path = url.slice("file:".length);
  // Relative `file:local.db` resolves against cwd; absolute paths need the parent dir.
  if (path.startsWith("/") || /^[A-Za-z]:[\\/]/.test(path)) {
    mkdirSync(dirname(path), { recursive: true });
    return;
  }
  mkdirSync(desktopConfigDir(), { recursive: true });
}

const url = process.env.DATABASE_URL?.trim() || defaultDatabaseUrl();
ensureLocalDbParent(url);

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

/** Embedded Turso/libSQL DB (vector-capable). Not better-sqlite3. */
export const db = drizzle(client, { schema });

export type DesktopDatabase = typeof db;

export { client as libsqlClient };
