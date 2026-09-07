# `@repo/auth`

Shared Better Auth pieces for every app (TanStack Start, Hono API, Deno desktop, CLI).

GitHub OAuth only — no email/password. App-specific wiring (plugins, DB adapter, cookie plugin) stays in the app.

## Exports

| Import | Use for |
| --- | --- |
| `@repo/auth` | `authEnvSchema`, `createAuth`, `createAuthFromEnv`, roles, `getGithubAccessToken` |
| `@repo/auth/client` | Vanilla `createAuthClient` (Deno / non-React) |
| `@repo/auth/react` | React `createAuthClient` |
| `@repo/auth/tanstack-start` | `tanstackStartCookies` (same better-auth instance as the factory) |
| `@repo/auth/cli-credentials` | On-disk CLI tokens |

## Two app patterns

### Cookie session (TanStack Start / desktop)

No database — Better Auth keeps the session and GitHub account in signed cookies.

1. Parse env with `authEnvSchema` (or `.extend()` / `.merge()` your app schema, then parse once).
2. Call `createAuthFromEnv(env, extraPlugins)`.
3. TanStack Start: import `tanstackStartCookies` from `@repo/auth/tanstack-start` and pass it **last**.
4. Mount `auth.handler` at `/api/auth/$`.

### DB-backed (Hono API + Turso)

App owns `betterAuth({ database: drizzleAdapter(...), plugins: [...] })`. Import shared pieces:

- `authEnvSchema` / GitHub helpers from `@repo/auth`
- `ROLE` / role helpers for app-level admin checks

Do **not** enable `emailAndPassword`. Use GitHub social + optional plugins (`admin`, `bearer`, `@better-auth/api-key`).

## GitHub App

Callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`.

Base scopes: `read:user`, `user:email`, `repo`, `read:org`. Optional (opt-in on sign-in): `delete_repo`, `user:follow`. Pass selected scopes via `signIn.social({ scopes: buildGithubOAuthScopes([...]) })` — that overrides the server default. Existing sessions need a fresh GitHub sign-in after scope changes.
