import { createAuthClient } from "better-auth/react";
import type { Auth } from "./create-auth";

export type CreateReactAuthClientOptions = {
  baseURL: string;
  basePath?: string;
};

/**
 * React Better Auth client for TanStack Start / browser apps.
 */
export function createReactAuthClient(options: CreateReactAuthClientOptions) {
  return createAuthClient({
    baseURL: options.baseURL,
    basePath: options.basePath ?? "/api/auth",
  });
}

export type ReactAuthClient = ReturnType<typeof createReactAuthClient>;
export type BetterAuthSession = Auth["$Infer"]["Session"];

/**
 * Maps a Better Auth client error into a short user-facing message.
 */
export function authClientErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "status" in error && error.status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (error instanceof Error) return error.message;
  return undefined;
}
