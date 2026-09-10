/// <reference lib="deno.ns" />

import { DEFAULT_LOOPBACK_PORT } from "./constants.ts";
import type { AuthConfig } from "./types.ts";

export function configDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE");
  if (!home) {
    throw new Error(
      "Desktop auth: HOME or USERPROFILE is unset — cannot resolve ~/.config/tangerine-desktop.",
    );
  }
  return `${home}/.config/tangerine-desktop`;
}

export function sessionPath(): string {
  return `${configDir()}/session.json`;
}

export function pkcePath(): string {
  return `${configDir()}/pkce.json`;
}

export function loopbackPort(): number {
  const raw = Deno.env.get("DESKTOP_AUTH_LOOPBACK_PORT");
  if (!raw) return DEFAULT_LOOPBACK_PORT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `Desktop auth: DESKTOP_AUTH_LOOPBACK_PORT must be a positive number (got ${JSON.stringify(raw)}).`,
    );
  }
  return Math.trunc(n);
}

function requireEnv(names: readonly string[]): string {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value) return value;
  }
  const listed = names.join(" or ");
  throw new Error(
    `Desktop auth: missing ${listed}. Set it in apps/desktop/.env and restart (preload does not hot-reload env).`,
  );
}

export function readConfig(): AuthConfig {
  // Prefer VITE_API_URL — BETTER_AUTH_URL is easy to leave pointing at :3070.
  const betterAuthUrl = requireEnv(["VITE_API_URL", "BETTER_AUTH_URL"]).replace(/\/$/, "");
  const signInURL = requireEnv(["VITE_SIGN_IN_URL", "SIGN_IN_URL"]);
  return { betterAuthUrl, signInURL };
}

export function authBase(cfg: AuthConfig): string {
  return `${cfg.betterAuthUrl}/api/auth`;
}
