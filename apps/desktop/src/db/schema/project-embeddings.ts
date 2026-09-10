import { EMBEDDING_DIMENSIONS } from "@repo/gemma-embedding/constants";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { float32Array } from "./vector";

/**
 * Chunk embeddings for local vector search (Turso `F32_BLOB` + `libsql_vector_idx`).
 * Index is created via raw SQL in `ensureVectorIndex` — drizzle-kit cannot emit it.
 */
export const projectEmbeddings = sqliteTable(
  "project_embeddings",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
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
    uniqueIndex("project_embeddings_owner_name_chunk_uidx").on(
      table.owner,
      table.name,
      table.chunkKey,
    ),
  ],
);
