import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { live } from "@electric-sql/pglite/live";
import { vector } from "@electric-sql/pglite-pgvector";
import { drizzle } from "drizzle-orm/pglite";
import { resolveDatabaseDir } from "./path";
import * as schema from "./schema";

/**
 * PGlite NodeFS data dir (or `memory://`).
 * @see https://orm.drizzle.team/docs/get-started/pglite-new
 * @see https://pglite.dev/docs/filesystems
 */
const dataDir = resolveDatabaseDir();

if (dataDir !== "memory://") {
  mkdirSync(dataDir, { recursive: true });
}

/**
 * Same shape as the Drizzle guide (`new PGlite(url)` → `drizzle({ client })`),
 * plus [live queries](https://pglite.dev/docs/live-queries) and
 * [pgvector](https://github.com/pgvector/pgvector).
 *
 * `CREATE EXTENSION vector` lives in migrations (`0000_extensions.sql`).
 * `live` is registered here only (JS plugin — no SQL extension in this build).
 */
export const client = await PGlite.create({
  dataDir,
  extensions: {
    live,
    vector,
  },
});

export const db = drizzle({ client, schema });

export type DesktopDatabase = typeof db;

/** @deprecated Prefer {@link client}. */
export const pglite = client;
export const pgClient = client;
