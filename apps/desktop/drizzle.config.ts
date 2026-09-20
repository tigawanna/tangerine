import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { resolveDatabaseDir } from "./src/pglite/path";

/**
 * PGlite via Drizzle Kit — see https://orm.drizzle.team/docs/get-started/pglite-new
 * and https://orm.drizzle.team/docs/drizzle-config-file (`driver: "pglite"`).
 *
 * Runtime also loads `live` + `pgvector` in `src/pglite/client.ts`; apply migrations with
 * `pnpm db:migrate` (scripts/db-migrate.ts) so those extensions are registered.
 */
export default defineConfig({
  out: "./src/pglite/migrations",
  schema: "./src/pglite/schema/index.ts",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: resolveDatabaseDir(),
  },
});
