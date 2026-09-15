import { EMBEDDING_DIMENSIONS } from "@repo/gemma-embedding/constants";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { float32Array } from "./vector";

/**
 * How the user relates to this repo.
 * Primary query path filters `type = 'starred'`; other/null values are fine —
 * the table can hold any repo (starred or not).
 */
export type EnrichedRepoType = "starred";

/**
 * Chunk embeddings for enriched repos (Turso `F32_BLOB` + `libsql_vector_idx`).
 * Index is created via raw SQL in `ensureVectorIndex` — drizzle-kit cannot emit it.
 */
export const enrichedRepos = sqliteTable(
  "enriched_repos",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    /** `"starred"` when this is a repo the user has starred; omit for other repos. */
    type: text("type").$type<EnrichedRepoType>(),
    chunkKey: text("chunk_key").notNull(),
    modelId: text("model_id").notNull(),
    sourceGeneration: integer("source_generation").notNull(),
    sourceEnrichmentAt: integer("source_enrichment_at", { mode: "timestamp_ms" }),
    text: text("text").notNull(),
    embedding: float32Array("embedding", { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("enriched_repos_owner_name_chunk_uidx").on(
      table.owner,
      table.name,
      table.chunkKey,
    ),
  ],
);
