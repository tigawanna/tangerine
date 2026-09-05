# `@repo/auth`

Shared Better Auth factory for every app (TanStack Start, Deno desktop, CLI).

GitHub OAuth only. No database — Better Auth keeps the session and GitHub account in signed cookies.

## Exports

| Import | Use for |
| --- | --- |
| `@repo/auth` | `authEnvSchema`, `createAuth`, `createAuthFromEnv`, roles, `getGithubAccessToken` |
| `@repo/auth/client` | Vanilla `createAuthClient` (Deno / non-React) |
| `@repo/auth/react` | React `createAuthClient` |
| `@repo/auth/tanstack-start` | `tanstackStartCookies` (same better-auth instance as the factory) |
| `@repo/auth/cli-credentials` | On-disk CLI tokens |

## App wiring

1. Parse env with `authEnvSchema` (or `.extend()` / `.merge()` your app schema, then parse once).
2. Call `createAuthFromEnv(env, extraPlugins)`.
3. TanStack Start: import `tanstackStartCookies` from `@repo/auth/tanstack-start` and pass it **last**.
4. Mount `auth.handler` at `/api/auth/$`.

## GitHub App

Callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`.

Default scopes: `read:user`, `user:email`, `repo`, `read:org` (private repos + org profiles/members). Existing sessions need a fresh GitHub sign-in after scope changes.
