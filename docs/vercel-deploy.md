# Vercel deploy (API + web proxy + Turso)

How `apps/api` and `apps/web` are deployed on Vercel, why the build is unusual, and the Turso / OAuth cookie traps we hit. Auth product flows: [`auth.md`](./auth.md). Short redirect cheat sheet: [`auth-redirects.md`](./auth-redirects.md).

Two Vercel projects:

| Project | Root Directory | Public hostname (example) | Role |
| ------- | -------------- | ------------------------- | ---- |
| API | `apps/api` | `tangerine-api.vercel.app` | Hono + Better Auth + Turso |
| Web | `apps/web` | `tangerine-dev.vercel.app` | TanStack Start UI; proxies `/api/*` → API |

---

## 1. Hono on Vercel (`apps/api`)

### Why not the Hono framework preset?

Vercel’s Hono integration transpiles source **file-by-file**. That breaks monorepo imports (`@api/*`, workspace `.ts` exports). See [vercel/vercel#14910](https://github.com/vercel/vercel/issues/14910).

### What we do instead

1. Framework preset **Other** (`framework: null` in `apps/api/vercel.json`).
2. Build: `pnpm run build:vercel` → Vite+ **`vp pack`** (tsdown / Rolldown) in `apps/api/vite.config.ts`.
3. Output: Build Output API v3 under `.vercel/output/` — one Node ESM serverless function.

```
apps/api/
  vercel.json          # framework: null, buildCommand → build:vercel, outputDirectory: .vercel/output
  vite.config.ts       # vp pack → .vercel/output/functions/index.func + BOA metadata
  src/vercel-entry.ts  # export default handle(app) from @hono/node-server/vercel
  src/index.ts         # local serve() only when VERCEL is unset; default-exports app
```

### Critical: `shouldAddHelpers: false`

In `.vc-config.json` (written by the pack hook):

```json
{
  "runtime": "nodejs22.x",
  "shouldAddHelpers": false,
  "supportsResponseStreaming": true
}
```

Vercel Node helpers parse `req.body` and **consume the request stream**. Better Auth then hangs forever on `request.json()` for `POST /api/auth/*` (300s timeout; UI stuck on “Redirecting…”). GETs still worked because they have no body.

**Do not** turn helpers back on.

### Local vs Vercel entry

| Env | Entry | Behavior |
| --- | ----- | -------- |
| Local | `tsx` → `src/index.ts` | `serve()` on `PORT` (default 5000) |
| Vercel | packed `vercel-entry` | `handle(app)` Node launcher |

### Deploy

```bash
pnpm --filter api deploy:vercel
# or from apps/api: pnpm deploy
```

---

## 2. Turso on Vercel

### Client split

| URL | Factory | Package |
| --- | ------- | ------- |
| `libsql://…` / remote `https://…` | `createRemoteDb` | `@libsql/client/http` + custom `fetch` |
| `file:…` / localhost | `createLocalDb` | `@libsql/client` (native bindings OK off-Vercel) |

Selection: `apps/api/src/db/client.ts` + `isTursoRemote()` in `turso.ts`.

Pack **aliases** bare `@libsql/client` → `@libsql/client/http` so the Vercel bundle stays JS-only (no native bindings). Local `file:` never enters that graph.

### Bug: Authorization never reaches Turso on Vercel Node

`@libsql/hrana-client` builds a `Request` via `@libsql/isomorphic-fetch`. On Vercel’s Node runtime that path **fails to send `Authorization`**. The same JWT works with raw `globalThis.fetch` / `node:https`.

Symptom: auth / DB calls fail with Turso HTTP auth errors even when `DATABASE_AUTH_TOKEN` is set correctly in the project env.

### Fix: `vercelSafeLibsqlFetch`

`apps/api/src/db/vercel-safe-fetch.ts` — custom `fetch` passed into `createClient`:

1. Re-issue the request with `globalThis.fetch(request.url, …)`.
2. Always set `Authorization: Bearer <token>`.
3. Pass `duplex: "half"` when forwarding a body (Undici requirement).

Wired in `http-client.ts`:

```ts
createClient({
  url,
  authToken,
  fetch: vercelSafeLibsqlFetch(authToken),
});
```

### Env (API project)

| Var | Notes |
| --- | ----- |
| `DATABASE_URL` | Turso `libsql://…` — **not** `file:` on Vercel |
| `DATABASE_AUTH_TOKEN` | Required for remote Turso |

### Smoke test

`GET /api/debug/db` (alias `/api/debug/db-env`) with `Authorization: Bearer <BETTER_AUTH_SECRET>` or `?secret=` — runs `select 1` through the same Drizzle client as the app.

---

## 3. Same-origin `/api` proxy (`apps/web`)

### Why

Web and API are **different** `*.vercel.app` hosts. That public suffix cannot share cookies across subdomains. Starting OAuth from the web origin while `Set-Cookie` is on the API origin → third-party cookie blocked → Better Auth:

```
State mismatch: State not persisted correctly
code: state_security_mismatch
```

Browser often then lands on `https://tangerine-api.vercel.app/?error=state_mismatch` (404) because the error redirect used the wrong base URL.

Permissions-Policy console noise (`attribution-reporting`, etc.) is unrelated Vercel/ads chrome.

### Architecture

```
Browser (tangerine-dev.vercel.app)
  │  authClient / honoClient → VITE_APP_URL (same origin)
  ▼
/api/*  ──proxy──►  tangerine-api.vercel.app/api/*
  │                    Hono + Better Auth + Turso
  ▼
Set-Cookie is first-party on the **web** host
GitHub callback → web /api/auth/callback/github → proxy → API
```

Desktop / Electron still call the **API hostname** directly (Bearer / Electron plugin). Only the browser cookie jar needs the proxy.

### Implementation

| Layer | Where | What |
| ----- | ----- | ---- |
| Dev + Nitro | `apps/web/nitro.config.ts` | `routeRules["/api/**"].proxy` + `devProxy["/api"]` → `VITE_API_URL` |
| Vercel edge | `apps/web/vercel.json` | `rewrites`: `/api/:path*` → `https://tangerine-api.vercel.app/api/:path*` |
| Clients | `auth-client.ts`, `api/client.ts` | `baseURL: VITE_APP_URL` (not `VITE_API_URL`) |

`VITE_API_URL` is **proxy upstream only** for the browser app. Do not point the web auth client at the API host in production.

### Env that must agree

| Location | Var | Value |
| -------- | --- | ----- |
| API (Vercel + local) | `BETTER_AUTH_URL` | **Web** public origin (`https://tangerine-dev.vercel.app` / `http://localhost:3064`) |
| API | `FRONTEND_URL` / trusted origins | Same web origin (+ desktop / Electron) |
| Web | `VITE_APP_URL` | Web public origin |
| Web | `VITE_API_URL` | API origin (proxy target) |
| GitHub OAuth app | Authorization callback URL | `{BETTER_AUTH_URL}/api/auth/callback/github` (**web**, not API host) |

If `BETTER_AUTH_URL` is still the API hostname, OAuth redirect URIs and cookie checks disagree with the proxy and `state_security_mismatch` returns.

### Local checklist

1. API `.env`: `BETTER_AUTH_URL=http://localhost:3064`
2. Web `.env`: `VITE_APP_URL=http://localhost:3064`, `VITE_API_URL=http://localhost:5000`
3. GitHub app callback includes `http://localhost:3064/api/auth/callback/github`
4. Run API `:5000` and web `:3064`; browser only talks to `:3064`

### Prod checklist

1. Set API `BETTER_AUTH_URL` to the web Vercel URL
2. Update GitHub callback to `https://<web>/api/auth/callback/github`
3. Redeploy **web** (proxy rewrite) and **API** (new `BETTER_AUTH_URL`)
4. Confirm web `VITE_API_URL` points at the API deployment used in `vercel.json` (or update the rewrite destination if the API hostname changes)

---

## 4. Symptom → cause cheat sheet

| Symptom | Likely cause |
| ------- | ------------ |
| `state_security_mismatch` / “State not persisted correctly” | Cookies on API host; missing same-origin proxy; or `BETTER_AUTH_URL` still API URL |
| `GET …vercel.app/?error=state_mismatch` 404 | Error redirect against API `baseURL`; fix `BETTER_AUTH_URL` + proxy |
| Social POST hangs ~300s / “Redirecting…” forever | `shouldAddHelpers: true` consumed body — keep `false` |
| Turso unauthorized / DB ping fails with token set | Missing `vercelSafeLibsqlFetch`; or wrong `DATABASE_AUTH_TOKEN` |
| Build fails on `@api/*` / workspace `.ts` | Using Hono framework preset instead of `vp pack` BOA |
| Auth works locally, fails only on Vercel | Proxy / `BETTER_AUTH_URL` / Turso fetch — not GitHub client id |

---

## 5. Key files

| Concern | Path |
| ------- | ---- |
| API Vercel project config | `apps/api/vercel.json` |
| `vp pack` + BOA + libsql alias + helpers flag | `apps/api/vite.config.ts` |
| Vercel Hono handler | `apps/api/src/vercel-entry.ts` |
| Turso HTTP + safe fetch | `apps/api/src/db/http-client.ts`, `vercel-safe-fetch.ts` |
| DB ping | `apps/api/src/routes/debug/route.ts` |
| Web Nitro /dev proxy | `apps/web/nitro.config.ts` |
| Web Vercel rewrite | `apps/web/vercel.json` |
| Browser auth / Hono clients | `apps/web/src/lib/auth-client.ts`, `api/client.ts` |
| Auth product flows | [`docs/auth.md`](./auth.md) |
