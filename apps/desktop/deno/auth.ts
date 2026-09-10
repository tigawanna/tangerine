/**
 * Deno Desktop auth — public API.
 * Implementation lives in `./auth/` (split by concern).
 */
/// <reference lib="deno.ns" />

export {
  authenticate,
  getGithubAccessToken,
  getSession,
  openExternal,
  requestAuth,
  scheme,
  setAuthListeners,
  signOut,
  startLoopbackServer,
  type DesktopAuthSession,
  type DesktopAuthUser,
} from "./auth/mod.ts";
