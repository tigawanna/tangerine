/**
 * Deno Desktop runtime logger → monorepo `.evlog/logs` (same sink as api/web).
 * Wide events use `service: tangerine-desktop-runtime` so they are filterable.
 */
/// <reference lib="deno.ns" />
import { createLogger, initLogger } from "npm:evlog@2.28.0";
import { createFsDrain } from "npm:evlog@2.28.0/fs";

const LOG_DIR = new URL("../../../.evlog/logs", import.meta.url).pathname;

let ready = false;

function ensureEvlog(): void {
  if (ready) return;
  initLogger({
    env: {
      service: "tangerine-desktop-runtime",
      environment: Deno.env.get("NODE_ENV") ?? "development",
    },
    drain: createFsDrain({
      dir: LOG_DIR,
      maxFiles: 14,
    }),
  });
  ready = true;
}

/**
 * Emit one wide event for a desktop-auth step. Never pass tokens/secrets.
 */
export function logDesktopAuth(
  action: string,
  fields: Record<string, unknown> = {},
  level: "info" | "warn" | "error" = "info",
): void {
  try {
    ensureEvlog();
    const log = createLogger({
      action,
      source: "deno-desktop-auth",
      level,
      ...fields,
    });
    log.emit();
  } catch {
    // Logging must never break OAuth.
  }
}
