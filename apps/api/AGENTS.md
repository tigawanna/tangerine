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

Handler at `/api/auth/*`. `BETTER_AUTH_URL` is the public **web** origin (`apps/web` proxies `/api` → this app) so OAuth cookies are first-party. GitHub callback: `{BETTER_AUTH_URL}/api/auth/callback/github`.

Include `com.tigawanna.tangerine:/` in `BETTER_AUTH_TRUSTED_ORIGINS` (or rely on `ELECTRON_TRUSTED_ORIGIN` merged in `createApiAuth`).

## Scripts

`pnpm --filter api dev` · `auth:gen` · `db:gen` / `db:generate` · `db:push` · `db:migrate` · `db:studio` · `deploy` / `deploy:vercel`

Do **not** hand-edit `src/db/schema/auth-schema.ts` — regenerate with `pnpm --filter api auth:gen`, then `db:gen` / `db:push` as needed.

## Deploy (Vercel)

Full write-up (Hono `vp pack` BOA, `shouldAddHelpers: false`, Turso `vercelSafeLibsqlFetch`, web `/api` proxy, env checklist): [`docs/vercel-deploy.md`](../../docs/vercel-deploy.md).

Short version: separate Vercel project, Root = `apps/api`, `framework: null`, build `vp pack` → `.vercel/output`. `BETTER_AUTH_URL` = **web** public origin (not this API hostname). GitHub callback = `{BETTER_AUTH_URL}/api/auth/callback/github`.

## Logging (evlog)

Dev FS drain writes NDJSON to the **monorepo root** [`.evlog/logs/`](../../.evlog/logs/) with `service: tangerine-api`. Auth routes are force-kept. Restart `api` after changing drain config. **Read:** latest `YYYY-MM-DD.jsonl` (one event per line); `rg '"service":"tangerine-api"|/auth/' .evlog/logs/`.
