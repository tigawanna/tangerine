import { EMBEDDING_DIMENSIONS } from "@repo/gemma-embedding/constants";
import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, vector } from "drizzle-orm/pg-core";

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
 * ANN index: custom migration `0002_project_enrichment_outputs_embedding_hnsw`
 * (drizzle-kit cannot emit `USING hnsw`).
 */
export const projectEnrichmentOutputs = pgTable(
  "project_enrichment_outputs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<EnrichedRepoType>(),
    description: text("description"),
    summary: text("summary"),
    url: text("url"),
    sourceGeneration: integer("source_generation").notNull(),
    payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
    modelId: text("model_id"),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embeddedAt: timestamp("embedded_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("project_enrichment_outputs_owner_name_uidx").on(table.owner, table.name),
  ],
);
