import { authClientErrorMessage, createReactAuthClient } from "@repo/auth/react";
import { clientEnv } from "@/lib/envs/client-env";

export const authClient = createReactAuthClient({
  baseURL: clientEnv.VITE_API_URL,
});

export { authClientErrorMessage };
export type { BetterAuthSession } from "@repo/auth/react";
