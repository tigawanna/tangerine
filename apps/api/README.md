# `api` — Tangerine backend

Hono API on Node: Better Auth (GitHub only), Drizzle, and Turso/libSQL. This is the only app that holds OAuth secrets and issues sessions. Full architecture: root [`README.md`](../../README.md) · [`docs/auth.md`](../../docs/auth.md) · [`docs/vercel-deploy.md`](../../docs/vercel-deploy.md).

## Routes

| Route                  | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `GET /api`             | Health check                                          |
| `GET/POST /api/auth/*` | Better Auth handler (GitHub OAuth, sessions, plugins) |
| `GET /api/viewer`      | Current session user, or 401                          |
| `GET /api/admin/users` | Paginated user listing (search, sort)                 |
| `GET /api/debug/db`    | Secret-gated database ping                            |

All routes are mounted under the `/api` base path.

## Auth

- GitHub OAuth only; no email/password.
- Plugins: `openAPI`, `electron`, `apiKey`, `bearer`, `admin`.
- Roles: `admin` / `user`; `ADMIN_EMAIL` promotes the matching account.
- `githubUsername` is copied from the GitHub profile for routing.
- Rate limit: 100 requests per minute.
- Trusted origins and CORS come from `BETTER_AUTH_TRUSTED_ORIGINS` + `FRONTEND_URL`.

`BETTER_AUTH_URL` must be the **web** origin, because the web app proxies `/api/*` here so cookies stay first-party. The GitHub callback is:

```
{BETTER_AUTH_URL}/api/auth/callback/github
```

## Database

- Drizzle + `@libsql/client`.
- `DATABASE_URL=file:local.db` locally; remote `libsql://…` + `DATABASE_AUTH_TOKEN` in production.
- `src/db/client.ts` selects the remote HTTP client or the local file client.
- Auth tables are generated: `pnpm --filter api auth:gen`, then `db:generate` / `db:migrate`.
- Do not hand-edit `src/db/schema/auth-schema.ts`.

## Typed client

The app exports `AppType`; the web app consumes it with `hc<AppType>` and `import type`, so server code never reaches the browser bundle.

## Commands

```bash
pnpm --filter api dev           # http://localhost:5000
pnpm --filter api check-types
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:studio
pnpm --filter api deploy:vercel
```

## Deploy

Vercel project rooted at `apps/api`, `framework: null`, build `pnpm run build:vercel` → `vp pack` → Build Output API v3. The packed function must keep `shouldAddHelpers: false`; otherwise Vercel consumes `req.body` and Better Auth hangs on `POST /api/auth/*`.
