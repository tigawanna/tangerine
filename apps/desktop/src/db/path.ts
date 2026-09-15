import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

/** On-disk config dir shared with Deno preload session files. */
export function desktopConfigDir(): string {
  return join(homedir(), ".config", "tangerine-desktop");
}

/** Options for {@link resolvePath}. */
export type ResolvePathInput = {
  /** Absolute/relative path or `file:…` URL. */
  path?: string | null;
  /** Same as `path` (Turso-style `file:…` URLs). */
  url?: string | null;
  /** Wins over `url` / `path` when set. */
  override?: string | null;
  /** Base dir for relative paths and the default filename. */
  basePath?: string;
  /** Filename used when no path/url/override is set. */
  defaultFile: string;
};

function pickRaw(input: ResolvePathInput): string | undefined {
  const raw = (input.override ?? input.url ?? input.path)?.trim();
  return raw || undefined;
}

function isAbsoluteFsPath(path: string): boolean {
  return isAbsolute(path) || /^[A-Za-z]:[\\/]/.test(path);
}

/** Remote Turso / in-memory URLs — not local filesystem paths. */
export function isRemoteDatabaseUrl(value: string): boolean {
  if (value === ":memory:") return true;
  if (value.startsWith("file:")) return false;
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

/**
 * Resolve a local DB file under the desktop config dir.
 *
 * - No input → `{basePath}/{defaultFile}`
 * - Relative path/`file:…` → joined under `basePath`
 * - Absolute path/`file:…` → used as-is
 * - `override` wins over `url` / `path`
 */
export function resolvePath(input: ResolvePathInput): string {
  const basePath = input.basePath ?? desktopConfigDir();
  const raw = pickRaw(input);

  if (!raw) {
    return join(basePath, input.defaultFile);
  }

  if (isRemoteDatabaseUrl(raw)) {
    throw new Error(`resolvePath expected a local file path, got remote URL: ${raw}`);
  }

  const filename = raw.startsWith("file:") ? raw.slice("file:".length) : raw;
  if (isAbsoluteFsPath(filename)) {
    return filename;
  }

  return join(basePath, filename);
}

/**
 * Resolve Turso/libSQL URL. Remote `libsql://` / `:memory:` pass through;
 * local paths become absolute `file:…` under {@link desktopConfigDir}.
 */
export function resolveDatabaseUrl(
  input?: string | null | Partial<ResolvePathInput>,
): string {
  const opts: ResolvePathInput = {
    defaultFile: "tangerine.db",
    ...(typeof input === "string" || input == null ? { url: input } : input),
  };

  const raw = pickRaw(opts);
  if (raw && isRemoteDatabaseUrl(raw)) {
    return raw;
  }

  return `file:${resolvePath(opts)}`;
}

/** Default embedded Turso/libSQL file URL. */
export function defaultDatabaseUrl(basePath?: string): string {
  return resolveDatabaseUrl(basePath ? { basePath } : undefined);
}

/** Default Conveyor SQLite queue path. */
export function defaultQueueDatabasePath(basePath?: string): string {
  return resolvePath({
    defaultFile: "queue.db",
    ...(basePath ? { basePath } : {}),
  });
}
