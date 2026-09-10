# `@repo/auth`

Shared Better Auth pieces for every app (TanStack Start, Hono API, Electron desktop, CLI).

GitHub OAuth only — no email/password. App-specific wiring (plugins, DB adapter, cookie plugin) stays in the app.

**Flows, gotchas, best practices:** [`docs/auth.md`](../../docs/auth.md).

## Exports

| Import | Use for |
| --- | --- |
| `@repo/auth` | `authEnvSchema`, `createAuth`, `createAuthFromEnv`, roles, `getGithubAccessToken`, `ELECTRON_PROTOCOL_SCHEME` |
| `@repo/auth/client` | Vanilla `createAuthClient` (CLI, non-React) |
| `@repo/auth/react` | React `createAuthClient` (optional `plugins`) |
| `@repo/auth/tanstack-start` | `tanstackStartCookies` (same better-auth instance as the factory) |
| `@repo/auth/cli-credentials` | On-disk CLI tokens |

## App patterns

### Frontend → remote API (web / Deno Desktop UI)

No Better Auth mount on the Start app. Same split as dishi `site`:

1. `createAuthClient({ baseURL: VITE_API_URL, basePath: "/api/auth", fetchOptions: { credentials: "include" } })`
2. Session via `authClient.getSession()` (and Electron/Deno proxy plugins as needed)
3. OAuth secrets + `electron()` + Turso live only on `apps/api`

### Cookie session factory (optional / legacy)

`createAuthFromEnv` + `tanstackStartCookies` still exist for apps that colocate auth. Prefer the remote API pattern for `apps/web`.

### DB-backed (Hono API + Turso)

App owns `betterAuth({ database: drizzleAdapter(...), plugins: [...] })`. Import shared pieces:

- `authEnvSchema` / GitHub helpers from `@repo/auth`
- `ROLE` / role helpers for app-level admin checks
- `electron()` from `@better-auth/electron` + `ELECTRON_TRUSTED_ORIGIN` for desktop deep links

Do **not** enable `emailAndPassword`. Use GitHub social + optional plugins (`admin`, `bearer`, `@better-auth/api-key`, `electron`).

### Electron / Deno desktop

Auth **server** is `apps/api`. Electron holds the Better Auth Electron client in main; Deno Desktop uses PKCE + loopback in the Deno runtime. Web `/auth` is the browser half (`electronProxyClient` + PKCE / `loopback`).

## GitHub App

Callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`.

Base scopes: `read:user`, `user:email`, `repo`, `read:org`. Optional (opt-in on sign-in): `delete_repo`, `user:follow`. Pass selected scopes via `signIn.social({ scopes: buildGithubOAuthScopes([...]) })` — that overrides the server default. Existing sessions need a fresh GitHub sign-in after scope changes.
