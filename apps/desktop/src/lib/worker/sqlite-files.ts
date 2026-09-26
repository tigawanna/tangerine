import { desktopConfigDir, resolveLocalPath } from "@/pglite/path.ts";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, join } from "node:path";

export type SqliteDbFile = {
  /** Stable id used in delete APIs (basename without path traversal). */
  id: string;
  /** Display name (e.g. `queues/starred-repo-embed.db`). */
  label: string;
  path: string;
  sizeBytes: number;
  mtimeMs: number;
};

function fileSize(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function mtime(path: string): number {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Lists Conveyor SQLite DB files under the desktop config dir
 * (`queue.db` + `queues/*.db`). Omits `-wal` / `-shm` sidecars from the list
 * (they are deleted with the main file).
 */
export function listQueueSqliteFiles(): SqliteDbFile[] {
  const root = desktopConfigDir();
  const entries: SqliteDbFile[] = [];

  const shared = resolveLocalPath(
    process.env.QUEUE_DATABASE_PATH ?? process.env.QUEUE_DATABASE_URL,
    "queue.db",
  );
  if (existsSync(shared)) {
    entries.push({
      id: "queue.db",
      label: "queue.db",
      path: shared,
      sizeBytes: fileSize(shared),
      mtimeMs: mtime(shared),
    });
  }

  const queuesDir = join(root, "queues");
  if (existsSync(queuesDir)) {
    for (const name of readdirSync(queuesDir)) {
      if (!name.endsWith(".db")) continue;
      const path = join(queuesDir, name);
      entries.push({
        id: `queues/${name}`,
        label: `queues/${name}`,
        path,
        sizeBytes: fileSize(path),
        mtimeMs: mtime(path),
      });
    }
  }

  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Deletes one listed SQLite DB (+ wal/shm). Rejects unknown ids.
 */
export function deleteQueueSqliteFile(id: string): { ok: true } | { ok: false; message: string } {
  const safe = id.trim();
  if (!safe || safe.includes("..") || safe.startsWith("/") || safe.startsWith("\\")) {
    return { ok: false, message: "Invalid database id" };
  }

  const match = listQueueSqliteFiles().find((file) => file.id === safe);
  if (!match) {
    return { ok: false, message: `Unknown database: ${safe}` };
  }

  try {
    rmSync(match.path, { force: true });
    rmSync(`${match.path}-wal`, { force: true });
    rmSync(`${match.path}-shm`, { force: true });
    return { ok: true };
  } catch (caught: unknown) {
    return {
      ok: false,
      message: caught instanceof Error ? caught.message : String(caught),
    };
  }
}

/** Basename-only helper for display. */
export function sqliteFileBasename(id: string): string {
  return basename(id);
}
