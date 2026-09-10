/// <reference lib="deno.ns" />

/** Must match `ELECTRON_PROTOCOL_SCHEME` in `@repo/auth` / electron-builder. */
export const PROTOCOL_SCHEME = "com.tigawanna.tangerine";
export const CLIENT_ID = "electron";
export const COOKIE_PREFIX = "better-auth";
/** Stable loopback port so HMR / re-sign-in does not orphan the browser URL. */
export const DEFAULT_LOOPBACK_PORT = 17832;

export const PKCE = Symbol.for("tangerine:deno-desktop-pkce");
export const LOOPBACK = Symbol.for("tangerine:deno-desktop-loopback");
