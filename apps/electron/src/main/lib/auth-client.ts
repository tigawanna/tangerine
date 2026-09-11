import { ELECTRON_PROTOCOL_SCHEME } from "@repo/auth";
import { electronClient } from "@better-auth/electron/client";
import { storage } from "@better-auth/electron/storage";
import { createAuthClient } from "better-auth/client";

const betterAuthUrl = import.meta.env.MAIN_VITE_BETTER_AUTH_URL ?? "http://localhost:5000";
const signInURL = import.meta.env.MAIN_VITE_SIGN_IN_URL ?? "http://localhost:3064/auth";

/**
 * Better Auth client for the Electron main process.
 * Session/cookies stay in main; renderer talks via IPC bridges from `setupRenderer()`.
 */
export const authClient = createAuthClient({
  baseURL: betterAuthUrl,
  basePath: "/api/auth",
  plugins: [
    electronClient({
      signInURL,
      protocol: {
        scheme: ELECTRON_PROTOCOL_SCHEME,
      },
      storage: storage(),
    }),
  ],
});
