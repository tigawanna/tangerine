import { ELECTRON_PROTOCOL_SCHEME } from "@repo/auth";
import { authClientErrorMessage } from "@repo/auth/react";
import { electronProxyClient } from "@better-auth/electron/proxy";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/lib/envs/client-env";

/**
 * Browser Better Auth client via same-origin `/api/auth` (proxied to apps/api).
 * Cookies stay first-party on the web origin — required on split `*.vercel.app` hosts.
 */
export const authClient = createAuthClient({
  baseURL: clientEnv.VITE_APP_URL,
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    electronProxyClient({
      protocol: {
        scheme: ELECTRON_PROTOCOL_SCHEME,
      },
    }),
  ],
});

export { authClientErrorMessage };
export type { BetterAuthSession } from "@repo/auth/react";
