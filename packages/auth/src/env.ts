import { z } from "zod";

/** Always requested on GitHub OAuth (browse repos, profile, orgs). */
export const GITHUB_BASE_SCOPES = [
  "read:user",
  "user:email",
  "repo",
  "read:org",
] as const;

export type GithubBaseScope = (typeof GITHUB_BASE_SCOPES)[number];

/**
 * Opt-in scopes — off by default on the sign-in screen; request only when
 * the user checks them (or when a missing-scope dialog deep-links them).
 */
export const GITHUB_OPTIONAL_SCOPES = [
  {
    id: "delete_repo",
    label: "Delete repositories",
    description: "Bulk-delete repos you administer.",
  },
  {
    id: "user:follow",
    label: "Follow users",
    description: "Follow and unfollow people on GitHub.",
  },
] as const;

export type GithubOptionalScopeId = (typeof GITHUB_OPTIONAL_SCOPES)[number]["id"];

const optionalScopeIds = GITHUB_OPTIONAL_SCOPES.map((s) => s.id);

/** @deprecated Prefer `GITHUB_BASE_SCOPES` — extras are opt-in at sign-in. */
export const DEFAULT_GITHUB_SCOPES = GITHUB_BASE_SCOPES;

/**
 * Merges base scopes with a filtered list of known optional scope ids.
 * Client `signIn.social({ scopes })` overrides the server default entirely.
 */
export function buildGithubOAuthScopes(
  optional: readonly string[] = [],
): string[] {
  const allowed = new Set<string>(optionalScopeIds);
  const extras = [...new Set(optional.filter((scope) => allowed.has(scope)))];
  return [...GITHUB_BASE_SCOPES, ...extras];
}

/**
 * Parses a comma-separated optional-scope query param into known ids only.
 */
export function parseOptionalGithubScopes(raw: string | undefined | null): GithubOptionalScopeId[] {
  if (!raw?.trim()) return [];
  const allowed = new Set<string>(optionalScopeIds);
  return [
    ...new Set(
      raw
        .split(",")
        .map((part) => part.trim())
        .filter((part): part is GithubOptionalScopeId => allowed.has(part)),
    ),
  ];
}

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
