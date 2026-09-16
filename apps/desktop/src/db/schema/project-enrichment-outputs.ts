import { EMBEDDING_DIMENSIONS } from "@repo/gemma-embedding/constants";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { float32Array } from "./vector";

/**
 * How the user relates to this repo.
 * Primary query path filters `type = 'starred'`; other/null values are fine.
 */
export type EnrichedRepoType = "starred" | "mine" | "other";

/**
 * One enriched repo (human-readable list SoT).
 *
 * Display fields are copied from artifacts at enrich time so list cards do not
 * join `project_repo_artifacts`. Embedding is one vector per repo (short
 * summary/description text — no chunk table). Null until embed wiring runs.
 * ANN index: custom migration `0001_project_enrichment_outputs_vector_idx`
 * (drizzle-kit cannot emit `libsql_vector_idx`).
 */
export const projectEnrichmentOutputs = sqliteTable(
  "project_enrichment_outputs",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<EnrichedRepoType>(),
    description: text("description"),
    summary: text("summary"),
    url: text("url"),
    sourceGeneration: integer("source_generation").notNull(),
    payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
    modelId: text("model_id"),
    embedding: float32Array("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embeddedAt: integer("embedded_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("project_enrichment_outputs_owner_name_uidx").on(table.owner, table.name),
  ],
);
