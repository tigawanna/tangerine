import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CREDENTIALS_DIR = join(homedir(), ".config", "tigawanna");
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, "credentials.json");

export type CliCredentials =
  | { kind: "bearer"; token: string; expiresAt: string | null }
  | { kind: "api-key"; apiKey: string };

/**
 * Returns the default on-disk path for CLI credentials.
 */
export function cliCredentialsPath() {
  return CREDENTIALS_FILE;
}

/**
 * Reads stored CLI credentials, or `null` when missing or invalid.
 */
export async function readCliCredentials(): Promise<CliCredentials | null> {
  try {
    const raw = await readFile(CREDENTIALS_FILE, "utf8");
    const parsed = JSON.parse(raw) as CliCredentials;
    if (parsed.kind === "bearer" && typeof parsed.token === "string") {
      return parsed;
    }
    if (parsed.kind === "api-key" && typeof parsed.apiKey === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists CLI credentials with restrictive file permissions.
 */
export async function writeCliCredentials(credentials: CliCredentials) {
  await mkdir(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CREDENTIALS_FILE, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  });
}

/**
 * Removes stored CLI credentials.
 */
export async function clearCliCredentials() {
  try {
    await unlink(CREDENTIALS_FILE);
  } catch {
    // missing file is fine
  }
}

/**
 * Converts stored credentials into auth headers for API calls.
 */
export function cliCredentialsToHeaders(credentials: CliCredentials) {
  const headers = new Headers();
  if (credentials.kind === "bearer") {
    headers.set("authorization", `Bearer ${credentials.token}`);
    return headers;
  }
  headers.set("x-api-key", credentials.apiKey);
  return headers;
}
