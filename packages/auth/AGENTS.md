# `@repo/auth`

Shared Better Auth pieces for every app (TanStack Start, Hono API, Electron desktop, CLI).

GitHub OAuth only — no email/password. App-specific wiring (plugins, DB adapter, cookie plugin) stays in the app.

## Exports

| Import | Use for |
| --- | --- |
| `@repo/auth` | `authEnvSchema`, `createAuth`, `createAuthFromEnv`, roles, `getGithubAccessToken`, `ELECTRON_PROTOCOL_SCHEME` |
| `@repo/auth/client` | Vanilla `createAuthClient` (CLI, non-React) |
| `@repo/auth/react` | React `createAuthClient` (optional `plugins`) |
| `@repo/auth/tanstack-start` | `tanstackStartCookies` (same better-auth instance as the factory) |
| `@repo/auth/cli-credentials` | On-disk CLI tokens |

## App patterns

### Cookie session (TanStack Start / web)

No database — Better Auth keeps the session and GitHub account in signed cookies.

1. Parse env with `authEnvSchema` (or `.extend()` / `.merge()` your app schema, then parse once).
2. Call `createAuthFromEnv(env, extraPlugins)`.
3. TanStack Start: import `tanstackStartCookies` from `@repo/auth/tanstack-start` and pass it **last**.
4. Mount `auth.handler` at `/api/auth/$`.

### DB-backed (Hono API + Turso)

App owns `betterAuth({ database: drizzleAdapter(...), plugins: [...] })`. Import shared pieces:

- `authEnvSchema` / GitHub helpers from `@repo/auth`
- `ROLE` / role helpers for app-level admin checks
- `electron()` from `@better-auth/electron` + `ELECTRON_TRUSTED_ORIGIN` for desktop deep links

Do **not** enable `emailAndPassword`. Use GitHub social + optional plugins (`admin`, `bearer`, `@better-auth/api-key`, `electron`).

### Electron desktop

Auth **server** is `apps/api`. Desktop only holds the Better Auth Electron client + session storage in the main process. Web `/auth` uses `electronProxyClient` + `ensureElectronRedirect`. Scheme: `ELECTRON_PROTOCOL_SCHEME` (`com.tigawanna.tangerine`).

## GitHub App

Callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`.

Base scopes: `read:user`, `user:email`, `repo`, `read:org`. Optional (opt-in on sign-in): `delete_repo`, `user:follow`. Pass selected scopes via `signIn.social({ scopes: buildGithubOAuthScopes([...]) })` — that overrides the server default. Existing sessions need a fresh GitHub sign-in after scope changes.
