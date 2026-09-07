# `api`

Hono API on Node. Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md).

Auth pieces (`authEnvSchema`, GitHub helpers, org AC/roles) come from [`@repo/auth`](../../packages/auth/AGENTS.md). This app owns the Better Auth instance (Turso adapter + plugins).

## Stack

- Hono + `@hono/node-server`
- Better Auth — GitHub OAuth only (no email/password)
- Drizzle + Turso / libsql (`DATABASE_URL`, optional `DATABASE_AUTH_TOKEN`)
- Admin/api-key/bearer plugins

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

## Scripts

`pnpm --filter api dev` · `db:gen` · `db:push` · `db:studio`
