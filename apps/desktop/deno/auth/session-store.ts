/// <reference lib="deno.ns" />

import { configDir, sessionPath } from "./config.ts";
import type { StoredSession } from "./types.ts";

export async function loadStored(): Promise<StoredSession | null> {
  try {
    const raw = await Deno.readTextFile(sessionPath());
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStored(session: StoredSession): Promise<void> {
  await Deno.mkdir(configDir(), { recursive: true });
  await Deno.writeTextFile(sessionPath(), JSON.stringify(session, null, 2));
}

export async function clearStored(): Promise<void> {
  try {
    await Deno.remove(sessionPath());
  } catch {
    // ignore
  }
}
