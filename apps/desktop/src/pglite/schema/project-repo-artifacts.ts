import type { SpelunkPayload } from "@repo/github";
import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Cached GitHub spelunk output per repo (owner/name).
 * `generation` bumps when artifacts are recollected.
 *
 * Display fields (`description`, `summary`, `url`) are denormalized from the
 * GitHub snapshot + README so list/search UI does not unpack `payload`.
 */
export const projectRepoArtifacts = pgTable(
  "project_repo_artifacts",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** First ~20 lines of the root README (see `clipReadmeSummary`). */
    summary: text("summary"),
    generation: integer("generation").notNull().default(1), // bumps when we re-collect this repo
    collectorVersion: text("collector_version").notNull(), // spelunk collector build that wrote the row
    payload: jsonb("payload").notNull().$type<SpelunkPayload>(), // full GitHub spelunk snapshot
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [uniqueIndex("project_repo_artifacts_owner_name_uidx").on(table.owner, table.name)],
);
