import "@tanstack/react-start/server-only";
import { createAuthFromEnv, type Auth } from "@repo/auth";
import { tanstackStartCookies } from "@repo/auth/tanstack-start";
import { serverEnv } from "@/lib/envs/server-env";

let auth: Auth | null = null;

/**
 * Better Auth singleton for the TanStack Start server runtime.
 */
export function getAuth(): Auth {
  auth ??= createAuthFromEnv(serverEnv, [tanstackStartCookies()]);
  return auth;
}
