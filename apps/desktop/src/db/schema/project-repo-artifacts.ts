import type { SpelunkPayload } from "@repo/github";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Cached GitHub spelunk output per repo (owner/name).
 * `generation` bumps when artifacts are recollected.
 */
export const projectRepoArtifacts = sqliteTable(
  "project_repo_artifacts",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    generation: integer("generation").notNull().default(1),
    collectorVersion: text("collector_version").notNull(),
    payload: text("payload", { mode: "json" }).notNull().$type<SpelunkPayload>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("project_repo_artifacts_owner_name_uidx").on(table.owner, table.name)],
);
