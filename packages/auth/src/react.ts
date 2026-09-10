import { createAuthClient } from "better-auth/react";
import type { Auth } from "./create-auth";

type AuthClientOptions = NonNullable<Parameters<typeof createAuthClient>[0]>;

export type CreateReactAuthClientOptions<
  TPlugins extends AuthClientOptions["plugins"] = AuthClientOptions["plugins"],
> = {
  baseURL: string;
  basePath?: string;
  plugins?: TPlugins;
};

/**
 * React Better Auth client for TanStack Start / browser apps.
 * Generic over `plugins` so client methods from plugins stay typed.
 */
export function createReactAuthClient<
  TPlugins extends AuthClientOptions["plugins"] = undefined,
>(options: CreateReactAuthClientOptions<TPlugins>) {
  return createAuthClient({
    baseURL: options.baseURL,
    basePath: options.basePath ?? "/api/auth",
    plugins: options.plugins as TPlugins,
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
