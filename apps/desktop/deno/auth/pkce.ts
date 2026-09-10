/// <reference lib="deno.ns" />

import { configDir, pkcePath } from "./config.ts";
import { PKCE } from "./constants.ts";

type PkceMap = Map<string, string>;

function pkceStore(): PkceMap {
  const g = globalThis as typeof globalThis & { [PKCE]?: PkceMap };
  g[PKCE] ??= new Map();
  return g[PKCE];
}

async function loadPkceDisk(): Promise<Record<string, string>> {
  try {
    const parsed = JSON.parse(await Deno.readTextFile(pkcePath())) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function savePkceDisk(map: Record<string, string>): Promise<void> {
  await Deno.mkdir(configDir(), { recursive: true });
  await Deno.writeTextFile(pkcePath(), JSON.stringify(map));
}

export async function rememberPkce(state: string, verifier: string): Promise<void> {
  pkceStore().set(state, verifier);
  const disk = await loadPkceDisk();
  disk[state] = verifier;
  const entries = Object.entries(disk);
  const trimmed =
    entries.length > 20 ? Object.fromEntries(entries.slice(entries.length - 20)) : disk;
  await savePkceDisk(trimmed);
}

/** Read PKCE without consuming — retries / Strict Mode remounts must not wipe it. */
export async function peekPkce(state: string): Promise<string | undefined> {
  const memory = pkceStore().get(state);
  if (memory) return memory;
  const disk = await loadPkceDisk();
  return disk[state];
}

export async function clearPkce(state: string): Promise<void> {
  pkceStore().delete(state);
  const disk = await loadPkceDisk();
  if (!(state in disk)) return;
  delete disk[state];
  await savePkceDisk(disk);
}
