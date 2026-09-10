import { setupRenderer } from "@better-auth/electron/preload";

/**
 * Exposes Better Auth IPC bridges (`requestAuth`, `signOut`, `onAuthenticated`, …)
 * to the renderer via `contextBridge`.
 */
setupRenderer();
