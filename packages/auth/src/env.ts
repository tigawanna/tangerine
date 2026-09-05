import { z } from "zod";

export const DEFAULT_GITHUB_SCOPES = [
  "read:user",
  "user:email",
  "repo",
  "delete_repo",
  "read:org",
] as const;

/**
 * Better Auth + GitHub OAuth env schema.
 * Compose with app-specific schemas via `.extend()` / `.merge()`, then `.parse(process.env)`.
 */
export const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  /** Comma-separated origins, e.g. `http://localhost:3064,https://example.com`. */
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  ADMIN_EMAIL: z.email().optional(),
});

export type AuthEnv = z.infer<typeof authEnvSchema>;
