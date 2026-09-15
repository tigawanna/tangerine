import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * AI enrichment for a repo, keyed to the artifacts `generation` it was built from.
 *
 * `description` / `summary` / `url` are copied from artifacts at enrich time so
 * list cards can render without joining `project_repo_artifacts`.
 */
export const projectEnrichmentOutputs = sqliteTable(
  "project_enrichment_outputs",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    /** Copied from artifacts / GitHub repo description. */
    description: text("description"),
    /** Copied README clip (first ~20 lines). */
    summary: text("summary"),
    /** GitHub repo URL. */
    url: text("url"),
    sourceGeneration: integer("source_generation").notNull(),
    payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("project_enrichment_outputs_owner_name_uidx").on(table.owner, table.name),
  ],
);
