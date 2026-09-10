# `api`

Hono API on Node. Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md).

Auth pieces (`authEnvSchema`, GitHub helpers, org AC/roles, Electron protocol constants) come from [`@repo/auth`](../../packages/auth/AGENTS.md). This app owns the Better Auth instance (Turso adapter + plugins), including the **Electron** plugin for desktop deep-link auth.

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

`pnpm --filter api dev` · `db:gen` · `db:push` · `db:studio`
