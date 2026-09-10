import { sql } from "drizzle-orm";
import { db } from "./client";

/**
 * ANN index for `project_embeddings.embedding`.
 * Must run after the table exists (`db:push` / migrate).
 */
export async function ensureVectorIndex(): Promise<void> {
  await db.run(sql`
    CREATE INDEX IF NOT EXISTS project_embeddings_vector_idx
    ON project_embeddings (
      libsql_vector_idx(embedding, 'metric=cosine')
    )
  `);
}
