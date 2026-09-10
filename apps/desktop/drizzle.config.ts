import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Turso dialect (libSQL) — required for `F32_BLOB` vector columns.
 * Do not switch this to plain `sqlite` / better-sqlite3.
 */
export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema/index.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
