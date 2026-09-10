/**
 * Deno Desktop Better Auth client (Electron-shaped, no Electron deps).
 *
 * Mirrors @better-auth/electron's requestAuth / authenticate contract against
 * apps/api's `electron()` plugin:
 *   1. PKCE in the Deno runtime (not the webview)
 *   2. System browser opens web `/auth` (or init-oauth-proxy)
 *   3. Return via loopback `http://127.0.0.1:<port>/callback?token=…`
 *   4. Fallback: paste the redirect token from the browser
 *   5. POST /api/auth/electron/token → store session on disk
 *
 * deepLinks in deno.json register the OS scheme for later; Deno does not yet
 * deliver open-url events, so we do not rely on them for the return path.
 */
/// <reference lib="deno.ns" />

export type { DesktopAuthSession, DesktopAuthUser } from "./types.ts";
export { setAuthListeners } from "./listeners.ts";
export { openExternal } from "./open-external.ts";
export { startLoopbackServer } from "./loopback.ts";
export { requestAuth } from "./request-auth.ts";
export { authenticate } from "./authenticate.ts";
export { getSession, signOut, getGithubAccessToken } from "./session.ts";

import { PROTOCOL_SCHEME } from "./constants.ts";

/** Custom protocol scheme registered in deno.json (`com.tigawanna.tangerine`). */
export function scheme(): string {
  return PROTOCOL_SCHEME;
}
