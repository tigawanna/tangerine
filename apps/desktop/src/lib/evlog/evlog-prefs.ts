import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

/** Default: keep ~2 weeks of daily `.jsonl` files. */
export const DEFAULT_EVLOG_MAX_FILES = 14;

export const EVLOG_MAX_FILES_OPTIONS = [3, 7, 14, 30, 90] as const;
export type EvlogMaxFiles = (typeof EVLOG_MAX_FILES_OPTIONS)[number];

export type DesktopEvlogPrefs = {
  /** Max daily log files to keep (evlog `maxFiles`). */
  maxFiles: EvlogMaxFiles;
};

function prefsPath(): string {
  return join(homedir(), ".config", "tangerine-desktop", "evlog.json");
}

function isEvlogMaxFiles(value: unknown): value is EvlogMaxFiles {
  return (
    typeof value === "number" &&
    (EVLOG_MAX_FILES_OPTIONS as readonly number[]).includes(value)
  );
}

/**
 * Reads persisted evlog retention prefs (falls back to defaults).
 */
export function readEvlogPrefs(): DesktopEvlogPrefs {
  try {
    const raw = readFileSync(prefsPath(), "utf8");
    const parsed = JSON.parse(raw) as { maxFiles?: unknown };
    return {
      maxFiles: isEvlogMaxFiles(parsed.maxFiles) ? parsed.maxFiles : DEFAULT_EVLOG_MAX_FILES,
    };
  } catch {
    return { maxFiles: DEFAULT_EVLOG_MAX_FILES };
  }
}

/** Persists evlog prefs under ~/.config/tangerine-desktop. */
export function writeEvlogPrefs(prefs: DesktopEvlogPrefs): void {
  const path = prefsPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ maxFiles: prefs.maxFiles }, null, 2)}\n`, "utf8");
}

export function evlogPrefsFilePath(): string {
  return prefsPath();
}
