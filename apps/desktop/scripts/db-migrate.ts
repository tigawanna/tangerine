/**
 * Apply Drizzle migrations with live + pgvector registered in the PGlite constructor.
 * (Plain `drizzle-kit migrate` opens PGlite without those JS extensions.)
 *
 * Generate SQL: `pnpm db:generate` / custom: `drizzle-kit generate --custom --name=…`
 * @see https://orm.drizzle.team/docs/get-started/pglite-new
 * @see https://orm.drizzle.team/docs/kit-custom-migrations
 */
import { migrate } from "drizzle-orm/pglite/migrator";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { client, db } from "../src/db/client.ts";

const migrationsFolder = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../src/db/migrations",
);

await migrate(db, { migrationsFolder });
await client.close();

console.info("PGlite migrations applied:", migrationsFolder);
