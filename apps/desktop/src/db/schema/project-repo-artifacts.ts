import type { SpelunkPayload } from "@repo/github";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Cached GitHub spelunk output per repo (owner/name).
 * `generation` bumps when artifacts are recollected.
 *
 * Display fields (`description`, `summary`, `url`) are denormalized from the
 * GitHub snapshot + README so list/search UI does not unpack `payload`.
 */
export const projectRepoArtifacts = sqliteTable(
  "project_repo_artifacts",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** First ~20 lines of the root README (see `clipReadmeSummary`). */
    summary: text("summary"),
    /** GitHub repo URL (`https://github.com/{owner}/{name}`). */
    url: text("url"),
    generation: integer("generation").notNull().default(1),
    collectorVersion: text("collector_version").notNull(),
    payload: text("payload", { mode: "json" }).notNull().$type<SpelunkPayload>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("project_repo_artifacts_owner_name_uidx").on(table.owner, table.name)],
);
