import { createAuthClient } from "better-auth/client";

export type CreateVanillaAuthClientOptions = {
  baseURL: string;
  basePath?: string;
};

/**
 * Framework-agnostic Better Auth client (Deno desktop, CLI, non-React apps).
 */
export function createVanillaAuthClient(options: CreateVanillaAuthClientOptions) {
  return createAuthClient({
    baseURL: options.baseURL,
    basePath: options.basePath ?? "/api/auth",
  });
}

export type VanillaAuthClient = ReturnType<typeof createVanillaAuthClient>;
