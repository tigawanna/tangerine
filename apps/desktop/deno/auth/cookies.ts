/// <reference lib="deno.ns" />

import { PROTOCOL_SCHEME } from "./constants.ts";
import type { CookieJar, StoredSession } from "./types.ts";

export function cookieHeader(jar: CookieJar): string {
  const now = Date.now();
  const pairs: string[] = [];
  for (const [key, entry] of Object.entries(jar)) {
    if (entry.expires && new Date(entry.expires).getTime() < now) continue;
    // Values come from Set-Cookie / set-auth-token — do not re-encode.
    pairs.push(`${key}=${entry.value}`);
  }
  return pairs.join("; ");
}

/**
 * API request headers for a stored desktop session.
 * Prefer Bearer (raw session token) — signed cookie jars are easy to get wrong,
 * and apps/api enables the `bearer()` plugin for this path.
 *
 * Origin must match `ELECTRON_TRUSTED_ORIGIN` — Better Auth CSRF rejects
 * cookie-bearing POSTs with a missing/null Origin (same as @better-auth/electron).
 */
export function apiHeaders(stored: StoredSession, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("origin", `${PROTOCOL_SCHEME}:/`);
  const cookie = cookieHeader(stored.cookies);
  if (cookie) headers.set("cookie", cookie);
  if (stored.token) headers.set("authorization", `Bearer ${stored.token}`);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return headers;
}

export function mergeSetCookie(jar: CookieJar, setCookie: string | null): CookieJar {
  if (!setCookie) return jar;
  const next = { ...jar };
  // Multiple Set-Cookie may arrive comma-joined; split carefully on ", <name>="
  const parts = setCookie.split(/,(?=\s*[^;=]+=)/);
  for (const part of parts) {
    const [pair, ...attrs] = part.split(";").map((s) => s.trim());
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    let expires: string | null = null;
    for (const attr of attrs) {
      const lower = attr.toLowerCase();
      if (lower.startsWith("max-age=")) {
        const maxAge = Number(attr.slice(8));
        if (Number.isFinite(maxAge)) {
          expires = new Date(Date.now() + maxAge * 1000).toISOString();
        }
      } else if (lower.startsWith("expires=")) {
        expires = new Date(attr.slice(8)).toISOString();
      }
    }
    next[name] = { value, expires };
  }
  return next;
}
