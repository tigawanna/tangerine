import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

/** Shared with Deno preload session files. */
export function desktopConfigDir(): string {
  return join(homedir(), ".config", "tangerine-desktop");
}

/**
 * Resolve a local path under the desktop config dir.
 * Absolute paths pass through; relative / bare names land under config.
 * Strips a leading `file:` if present (legacy env values).
 */
export function resolveLocalPath(
  value: string | null | undefined,
  fallbackName: string,
): string {
  const raw = value?.trim();
  if (!raw) return join(desktopConfigDir(), fallbackName);

  const path = raw.startsWith("file:") ? raw.slice("file:".length) : raw;
  return isAbsolute(path) ? path : join(desktopConfigDir(), path);
}

/**
 * PGlite `dataDir`: `memory://` for ephemeral, otherwise a filesystem directory.
 * Defaults to `~/.config/tangerine-desktop/pgdata`.
 */
export function resolveDatabaseDir(value = process.env.DATABASE_URL): string {
  const raw = value?.trim();
  if (raw === ":memory:" || raw === "memory://") return "memory://";
  return resolveLocalPath(raw, "pgdata");
}
