# `api`

Hono API on Node. Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md).

Auth pieces (`authEnvSchema`, GitHub helpers, org AC/roles, Electron protocol constants) come from [`@repo/auth`](../../packages/auth/AGENTS.md). This app owns the Better Auth instance (Turso adapter + plugins), including the **Electron** plugin for desktop deep-link auth. Flows / gotchas: [`docs/auth.md`](../../docs/auth.md).

## Stack

- Hono + `@hono/node-server`
- Better Auth — GitHub OAuth only (no email/password)
- Drizzle + Turso / libsql (`DATABASE_URL`, optional `DATABASE_AUTH_TOKEN`)
- Admin/api-key/bearer/**electron** plugins

## Typed client

Frontend apps import the app type via tsconfig paths:

```ts
import type { AppType } from "@api/app";
import { hc } from "hono/client";

export const honoClient = hc<AppType>(baseUrl, {
  init: { credentials: "include" },
});
```

Web `tsconfig` / Vite alias: `"@api/*": ["../api/src/*"]`.

## Auth mount

Handler at `/api/auth/*` (`BETTER_AUTH_URL` + GitHub callback `{BETTER_AUTH_URL}/api/auth/callback/github`).

Include `com.tigawanna.tangerine:/` in `BETTER_AUTH_TRUSTED_ORIGINS` (or rely on `ELECTRON_TRUSTED_ORIGIN` merged in `createApiAuth`).

## Scripts

`pnpm --filter api dev` · `auth:gen` · `db:gen` / `db:generate` · `db:push` · `db:migrate` · `db:studio` · `deploy` / `deploy:vercel`

Do **not** hand-edit `src/db/schema/auth-schema.ts` — regenerate with `pnpm --filter api auth:gen`, then `db:gen` / `db:push` as needed.

## Deploy (Vercel)

Separate Vercel project from `apps/web`. Root Directory = `apps/api`. Framework = Hono (`vercel.json` — leave build/output to Vercel; only override `installCommand` for the monorepo). `src/index.ts` default-exports the app; `serve()` runs only when `VERCEL` is unset.

**Env (API project):** `DATABASE_URL` (Turso `libsql://…`, not `file:`), `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (this deployment’s public origin), `BETTER_AUTH_TRUSTED_ORIGINS` (prod web + `com.tigawanna.tangerine:/`), `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`, optional `ADMIN_EMAIL`.

**GitHub OAuth callback:** `{BETTER_AUTH_URL}/api/auth/callback/github`.

**Web project:** set `VITE_API_URL` to the API origin. Auth secrets stay here only.

## Logging (evlog)

Dev FS drain writes NDJSON to the **monorepo root** [`.evlog/logs/`](../../.evlog/logs/) with `service: tangerine-api`. Auth routes are force-kept. Restart `api` after changing drain config. **Read:** latest `YYYY-MM-DD.jsonl` (one event per line); `rg '"service":"tangerine-api"|/auth/' .evlog/logs/`.
