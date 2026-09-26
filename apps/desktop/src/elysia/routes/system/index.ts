import {
  deleteAllEvlogFiles,
  EVLOG_FS_DIR,
  listEvlogFiles,
  pruneEvlogFiles,
} from "@/lib/evlog/evlog-logs.ts";
import {
  EVLOG_MAX_FILES_OPTIONS,
  readEvlogPrefs,
  writeEvlogPrefs,
  type EvlogMaxFiles,
} from "@/lib/evlog/evlog-prefs.ts";
import {
  deleteQueueSqliteFile,
  listQueueSqliteFiles,
} from "@/lib/worker/sqlite-files.ts";
import { Elysia, t } from "elysia";

/**
 * Local disk / process housekeeping under `/api/elysia/system/*`:
 * SQLite queue DBs + shared `.evlog/logs` retention.
 */
export const systemRoute = new Elysia({ prefix: "/system" })
  .post(
    "/open",
    async ({ body }) => {
      const { openSystemPathAt } = await import("@/lib/system/open-local-path.ts");
      try {
        return await openSystemPathAt(body.path);
      } catch (caught: unknown) {
        return {
          error: caught instanceof Error ? caught.message : String(caught),
        };
      }
    },
    {
      body: t.Object({
        path: t.String({ minLength: 1, maxLength: 4096 }),
      }),
      detail: {
        summary: "Reveal path in file manager",
        description: "Open a desktop-config or `.evlog/logs` path in the OS file manager.",
        tags: ["system"],
      },
    },
  )
  .get(
    "/sqlite",
    () => {
      const files = listQueueSqliteFiles().map((file) => ({
        id: file.id,
        label: file.label,
        path: file.path,
        sizeBytes: file.sizeBytes,
        mtimeMs: file.mtimeMs,
      }));
      return {
        files,
        totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
      };
    },
    {
      detail: {
        summary: "List Conveyor SQLite DB files",
        description: "queue.db and queues/*.db under the desktop config dir.",
        tags: ["system", "sqlite"],
      },
    },
  )
  .post(
    "/sqlite/delete",
    ({ body }) => {
      const result = deleteQueueSqliteFile(body.id);
      if (!result.ok) {
        return { ok: false as const, message: result.message };
      }
      return {
        ok: true as const,
        message: `Deleted ${body.id}`,
        files: listQueueSqliteFiles().map((file) => ({
          id: file.id,
          label: file.label,
          path: file.path,
          sizeBytes: file.sizeBytes,
          mtimeMs: file.mtimeMs,
        })),
      };
    },
    {
      body: t.Object({
        id: t.String({ minLength: 1, description: "File id from GET /system/sqlite" }),
      }),
      detail: {
        summary: "Delete a Conveyor SQLite DB file",
        description: "Removes the DB and wal/shm sidecars. Workers may need a restart.",
        tags: ["system", "sqlite"],
      },
    },
  )
  .get(
    "/logs",
    () => {
      const prefs = readEvlogPrefs();
      const files = listEvlogFiles().map((file) => ({
        name: file.name,
        path: file.path,
        sizeBytes: file.sizeBytes,
        mtimeMs: file.mtimeMs,
      }));
      return {
        dir: EVLOG_FS_DIR,
        maxFiles: prefs.maxFiles,
        maxFilesOptions: [...EVLOG_MAX_FILES_OPTIONS],
        files,
        totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
      };
    },
    {
      detail: {
        summary: "List evlog files + retention",
        description: "Shared monorepo `.evlog/logs` inventory and maxFiles prefs.",
        tags: ["system", "logs"],
      },
    },
  )
  .patch(
    "/logs/retention",
    ({ body }) => {
      const maxFiles = body.maxFiles as EvlogMaxFiles;
      writeEvlogPrefs({ maxFiles });
      const pruned = pruneEvlogFiles(maxFiles);
      const files = listEvlogFiles().map((file) => ({
        name: file.name,
        path: file.path,
        sizeBytes: file.sizeBytes,
        mtimeMs: file.mtimeMs,
      }));
      return {
        ok: true as const,
        maxFiles,
        pruned,
        files,
        totalBytes: files.reduce((sum, file) => sum + file.sizeBytes, 0),
        message: `Retention set to ${maxFiles} days (pruned ${pruned.deleted} files)`,
      };
    },
    {
      body: t.Object({
        maxFiles: t.Union(
          [t.Literal(3), t.Literal(7), t.Literal(14), t.Literal(30), t.Literal(90)],
          { description: "Max daily log files to keep" },
        ),
      }),
      detail: {
        summary: "Set evlog retention (maxFiles)",
        description: "Persists prefs and immediately prunes older daily files.",
        tags: ["system", "logs"],
      },
    },
  )
  .delete(
    "/logs",
    () => {
      const result = deleteAllEvlogFiles();
      return {
        ok: true as const,
        ...result,
        files: [] as const,
        totalBytes: 0,
        message: `Deleted ${result.deleted} log files`,
      };
    },
    {
      detail: {
        summary: "Delete all evlog files",
        description: "Removes every `.jsonl` under the shared `.evlog/logs` directory.",
        tags: ["system", "logs"],
      },
    },
  );
