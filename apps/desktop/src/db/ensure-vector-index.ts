import { sql } from "drizzle-orm";
import { db } from "./client";

/**
 * ANN index for `enriched_repos.embedding`.
 * Must run after the table exists (`db:push` / migrate).
 */
export async function ensureVectorIndex(): Promise<void> {
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS enriched_repos_vector_idx
    ON enriched_repos (
      libsql_vector_idx(embedding, 'metric=cosine')
    )
  `);
}
