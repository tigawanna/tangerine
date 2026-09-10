import { ELECTRON_PROTOCOL_SCHEME } from "@repo/auth";
import { authClientErrorMessage } from "@repo/auth/react";
import { electronProxyClient } from "@better-auth/electron/proxy";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/lib/envs/client-env";

export const authClient = createAuthClient({
  baseURL: clientEnv.VITE_API_URL,
  basePath: "/api/auth",
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
