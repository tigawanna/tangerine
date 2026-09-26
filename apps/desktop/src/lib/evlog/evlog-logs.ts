import { readEvlogPrefs } from "@/lib/evlog/evlog-prefs.ts";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Repo-root `.evlog/logs` (this file: `apps/<app>/src/lib/evlog`). */
export const EVLOG_FS_DIR = join(
  fileURLToPath(new URL("../../../../../.evlog/logs", import.meta.url)),
);

export type EvlogLogFile = {
  name: string;
  path: string;
  sizeBytes: number;
  mtimeMs: number;
};

function isJsonl(name: string): boolean {
  return name.endsWith(".jsonl");
}

/**
 * Lists daily (and rotated) NDJSON log files in the shared `.evlog/logs` dir.
 */
export function listEvlogFiles(): EvlogLogFile[] {
  if (!existsSync(EVLOG_FS_DIR)) return [];

  const files: EvlogLogFile[] = [];
  for (const name of readdirSync(EVLOG_FS_DIR)) {
    if (!isJsonl(name)) continue;
    const path = join(EVLOG_FS_DIR, name);
    try {
      const st = statSync(path);
      if (!st.isFile()) continue;
      files.push({
        name,
        path,
        sizeBytes: st.size,
        mtimeMs: st.mtimeMs,
      });
    } catch {
      // skip unreadable
    }
  }

  return files.sort((a, b) => b.name.localeCompare(a.name));
}

/**
 * Deletes every `.jsonl` under the evlog dir. Returns bytes removed + count.
 */
export function deleteAllEvlogFiles(): { deleted: number; bytes: number } {
  const files = listEvlogFiles();
  let deleted = 0;
  let bytes = 0;
  for (const file of files) {
    try {
      bytes += file.sizeBytes;
      rmSync(file.path, { force: true });
      deleted += 1;
    } catch {
      // continue
    }
  }
  return { deleted, bytes };
}

/**
 * Keeps the newest `maxFiles` log files (by name / date), deletes the rest.
 * Call after retention changes so disk frees up without waiting for the next write.
 */
export function pruneEvlogFiles(maxFiles = readEvlogPrefs().maxFiles): {
  deleted: number;
  bytes: number;
  kept: number;
} {
  const files = listEvlogFiles().sort((a, b) => b.name.localeCompare(a.name));
  const keep = files.slice(0, Math.max(1, maxFiles));
  const drop = files.slice(keep.length);
  let deleted = 0;
  let bytes = 0;
  for (const file of drop) {
    try {
      bytes += file.sizeBytes;
      rmSync(file.path, { force: true });
      deleted += 1;
    } catch {
      // continue
    }
  }
  return { deleted, bytes, kept: keep.length };
}
