import { authClientErrorMessage } from "@repo/auth/react";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/lib/envs/client-env";

/**
 * Browser / Deno Desktop auth client.
 * Deno Desktop (CEF) shares one cookie jar with the embedded server — no Electron PKCE proxy.
 */
export const authClient = createAuthClient({
  baseURL: clientEnv.VITE_API_URL,
  basePath: "/api/auth",
});

export { authClientErrorMessage };
export type { BetterAuthSession } from "@repo/auth/react";
