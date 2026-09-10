import { homedir } from "node:os";
import { join } from "node:path";

/** On-disk config dir shared with Deno preload session files. */
export function desktopConfigDir(): string {
  return join(homedir(), ".config", "tangerine-desktop");
}

/**
 * Default embedded Turso/libSQL file URL.
 * Override with `DATABASE_URL` (`file:…` or `libsql://…`).
 */
export function defaultDatabaseUrl(): string {
  return `file:${join(desktopConfigDir(), "tangerine.db")}`;
}
