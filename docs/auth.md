# Auth (web, API, Deno Desktop, Electron)

GitHub-only Better Auth. **Secrets and session issuance live on `apps/api`.** Frontends and desktop shells are clients.

Shared constants / helpers: [`packages/auth`](../packages/auth/AGENTS.md). Per-app wiring notes: [`apps/api`](../apps/api/AGENTS.md), [`apps/web`](../apps/web/AGENTS.md), [`apps/desktop`](../apps/desktop/AGENTS.md), [`apps/electron`](../apps/electron/AGENTS.md).

---

## Architecture

Desktop sign-in **starts in the native app**. The webview only kicks off auth; the Deno preload (or Electron main) owns PKCE, the system browser, and the session jar.

```
① Sign in clicked
┌─────────────────┐  bindings.requestAuth()  ┌─────────────────┐
│ Desktop UI      │ ───────────────────────► │ Deno preload    │
│ (webview :3070) │                          │ (or Electron    │
│ no OAuth jar    │ ◄─────────────────────── │  main)          │
└─────────────────┘  session via bindings    └────────┬────────┘
         ▲                     │                      │
         │                     │ ② PKCE + open        │ ⑤ POST /electron/token
         │                     │    system browser    │    Origin + Bearer
         │                     ▼                      ▼
         │            ┌─────────────────┐    ┌──────────────────┐
         │            │ System browser  │    │ apps/api :5000   │
         │            │ apps/web /auth  │───►│ Better Auth      │
         │            │    (:3064)      │◄───│ electron()+bearer│
         │            └────────┬────────┘    └──────────────────┘
         │                     │ ③ GitHub OAuth
         │                     │    callback → API
         │                     ▼
         │            ④ transferUser → fetch loopback ?token=
         │                     │
         └─────────────────────┘ ⑥ navigate /viewer + getSession
```

| Surface | Where session lives | How it talks to API |
| --- | --- | --- |
| **Web** (`apps/web`) | Browser cookies against `VITE_API_URL` | `authClient` + `credentials: "include"` |
| **Deno Desktop** | Deno disk jar `~/.config/tangerine-desktop/session.json` | Preload `fetch` + `Authorization: Bearer` + `Origin: com.tigawanna.tangerine:/` |
| **Electron** | Main-process `@better-auth/electron` storage | Official Electron client (sets Origin for you) |
| **Desktop UI webview** | None for auth — UI only | `bindings.*` when present |

Do **not** bake `GITHUB_CLIENT_SECRET` into web or desktop. GitHub callback is always:

`{BETTER_AUTH_URL}/api/auth/callback/github` → locally `http://localhost:5000/api/auth/callback/github`.

---

## Local ports (dev)

| App | Port | Role |
| --- | --- | --- |
| `apps/api` | `:5000` | Better Auth + Hono |
| `apps/web` | `:3064` | Browser + **desktop browser-half** sign-in (`VITE_SIGN_IN_URL`) |
| `apps/desktop` | `:3070` | Native window UI (`VITE_APP_URL`) |

Desktop token exchange must hit **`:5000`**, never `:3070`.

---

## Flows

### Web (browser)

1. `authClient.signIn.social({ provider: "github", callbackURL })`
2. `callbackURL` must be an **absolute** app URL (`VITE_APP_URL + path`). Relative paths resolve against the API base and land on `:5000/viewer`.
3. Session cookies are on the API origin; CORS + `trustedOrigins` must include the web origin.

### Deno Desktop (system browser + loopback)

Mirrors [Better Auth Electron](https://better-auth.com/docs/integrations/electron) without shipping `@better-auth/electron` in Deno:

1. Preload generates PKCE (`state` + verifier), starts loopback on `127.0.0.1`.
2. Opens `VITE_SIGN_IN_URL` (`apps/web` `/auth`) with `client_id`, `state`, `code_challenge`, `loopback`.
3. User signs in on web against the API; web polls `transferUser` only after **Sign in** (sessionStorage gate).
4. Web **fetches** `loopback?token=` (JSON `Accept`). On success it navigates to `/auth/desktop-done` (“close this tab”) so the user does not click Sign in again. On failure it stays on `/auth` with the paste token.
5. Preload `POST /api/auth/electron/token` with `{ token, state, code_verifier }`, persists session, notifies UI / navigates to `/viewer`.
6. Fallback: paste the redirect token into the desktop auth screen.

Custom scheme `com.tigawanna.tangerine` is registered for later. Deno does **not** deliver `open-url` to JS yet — **do not** rely on deep-link return today.

### Electron

Use `@better-auth/electron` in main (`electronClient` + `storage()`). Same web `/auth` half; return via protocol scheme when the OS delivers it.

---

## Env checklist

### `apps/api`

- `BETTER_AUTH_URL=http://localhost:5000`
- `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `BETTER_AUTH_TRUSTED_ORIGINS` / list including:
  - `http://localhost:3064`, `http://localhost:3070`
  - `com.tigawanna.tangerine:/` (also merged as `ELECTRON_TRUSTED_ORIGIN` in code)
- Auth tables exist: `pnpm --filter api db:push` (empty Turso → social sign-in 500s)

### `apps/web`

- `VITE_APP_URL=http://localhost:3064`
- `VITE_API_URL=http://localhost:5000`
- No GitHub secrets

### `apps/desktop`

- `VITE_APP_URL=http://localhost:3070`
- `VITE_API_URL=http://localhost:5000` (token exchange + session)
- `VITE_SIGN_IN_URL=http://localhost:3064/auth`
- Optional `BETTER_AUTH_URL` — **must be the API**, never `:3070`
- Optional `DESKTOP_AUTH_LOOPBACK_PORT=17832`

---

## Gotchas (learned the hard way)

### 1. Relative `callbackURL` hits the API

Better Auth resolves relative callback URLs against `baseURL` (`:5000`). After GitHub you bounce to `http://localhost:5000/viewer` instead of the app. Always pass absolute URLs from `VITE_APP_URL`.

### 2. Deno Desktop remaps loopback ports

Prefer a stable port (`17832`), but **always advertise the port from `onListen`**, not the preferred one. Remapped ports + stale URLs after HMR → web “success” against a dead or orphan listener.

Keep a strong ref to `Deno.HttpServer` so the loopback is not GC’d after `requestAuth` returns. Start the loopback at boot, not only on Sign in.

### 3. Web toast ≠ desktop session

“Signed in — return to Tangerine Desktop” only means the loopback returned HTTP 200. The desktop UI can still sit on `/auth` if:

- session was not persisted, or was cleared immediately after
- `executeJs` CustomEvents never reached the webview
- `/auth` `beforeLoad` checked **browser/server** `getSession` instead of `bindings.getSession()`

### 4. Raw session token ≠ signed cookie

`POST /electron/token` JSON `token` is the **DB session token**. Cookie `better-auth.session_token` is usually **signed**. Putting the raw token in the Cookie header makes `get-session` return empty.

**Do:**

- Prefer `Authorization: Bearer <raw token>` (API enables `bearer()`)
- Capture `Set-Cookie` / `set-auth-token` when present
- Do **not** `encodeURIComponent` cookie values from Set-Cookie

### 5. Do not wipe disk session on soft failures

A `get-session` that returns no user because cookies were wrong used to `clearStored()` and delete `session.json` right after a successful exchange. Only clear when the session is truly revoked / on sign-out. Prefer Bearer so validation matches the stored token.

### 6. Cookie-bearing POSTs need Origin

Better Auth CSRF: if the request has a `Cookie` header, missing/`null` Origin → `MISSING_OR_NULL_ORIGIN`.

Electron sets `Origin: com.tigawanna.tangerine:/`. Deno preload must do the same on authenticated API calls (`get-access-token`, `list-accounts`, `sign-out`, …). Symptom after login: dashboard opens, then 403 on GitHub token.

### 7. `/get-access-token` wants account **row** id

Body is `{ accountId }` (Better Auth `account.id` for provider `github`), not GitHub’s numeric user id and not a free-form `providerId` alone. Resolve via `listAccounts` first (web client or Deno preload).

### 8. Preload does not hot-reload

`deno/*` and `--env-file` are baked when the process starts. After auth/env changes: **fully quit** the desktop app and restart. Vite HMR only refreshes the UI bundle.

### 9. Desktop session ≠ CEF/webview cookies

Dashboard and auth guards must use `bindings.getSession()` / `bindings.getGithubAccessToken()` when `hasDesktopBindings()`. ServerFns that read Start request cookies will always look logged-out inside the native shell.

### 10. Gate desktop handoff until Sign in — and do not race GitHub

Do not poll `transferUser` / fire loopback while the user is still picking scopes. Use a sessionStorage flag set on Sign in click (`tangerine:awaiting-desktop-handoff`).

If a **web session already exists**, only run the loopback handoff — do **not** also start `signIn.social`. Otherwise transfer succeeds and clears the flag, then GitHub redirects back to `/auth` and you look “stuck” on Sign in again.

### 11. Fragments never hit HTTP loopback

Return token in the **query** (`?token=`), not `#token=`. Hash is not sent to the loopback server.

### 12. CEF vs OS webview

Auth does **not** require CEF. OAuth is system-browser + Deno preload. `--backend=cef` vs `webview` is rendering/size only. Webview: smaller binary, no unified DevTools, platform CSS variance. Same `bindings` / `navigate` / `executeJs` APIs.

### 13. Empty DB

Fresh `local.db` without auth tables → opaque social / token 500s. Run `pnpm --filter api db:push` (and `auth:gen` when schema plugins change).

---

## Best practices

1. **One auth server** — `apps/api` only. Web and desktop never mount their own Better Auth for production flows.
2. **Absolute post-login URLs** everywhere social redirect is used.
3. **Desktop: trust bindings**, not the embedded browser cookie jar.
4. **Bearer + trusted Origin** for all Deno → API authenticated fetches.
5. **Persist PKCE on disk** (`pkce.json`) so HMR / remounts do not lose the verifier; clear a state only after successful token exchange.
6. **Idempotent exchange** — if PKCE is gone but `session.json` is valid, treat as already signed in.
7. **Notify UI redundantly** after auth: CustomEvent + `win.navigate(/viewer)` + optional poll of `bindings.getSession()` while “Waiting for browser…”.
8. **Fetch loopback from web**, don’t `location.assign` the loopback URL — keeps paste UI on failure and avoids CORS surprises (`Accept: application/json`). On success, leave `/auth` for `/auth/desktop-done`.
9. **Log without secrets** — `desktop.auth.*` / API paths in monorepo [`.evlog/logs/`](../.evlog/logs/). Never log tokens, verifiers, or full cookies.
10. **Restart desktop** after preload or env edits before debugging “it still fails”.

---

## Debugging

Shared NDJSON: `.evlog/logs/YYYY-MM-DD.jsonl`

```bash
# Desktop OAuth runtime
rg '"service":"tangerine-desktop-runtime"|desktop\.auth' .evlog/logs/$(date -u +%Y-%m-%d).jsonl

# Token exchange + access token
rg 'electron/token|get-access-token|MISSING_OR_NULL_ORIGIN' .evlog/logs/$(date -u +%Y-%m-%d).jsonl

# On-disk session (Deno Desktop)
ls -la ~/.config/tangerine-desktop/
# expect session.json after a good login; pkce.json during/after in-flight PKCE
```

| Symptom | Likely cause |
| --- | --- |
| Social 500 on first run | Auth tables missing — `db:push` |
| Lands on `:5000/viewer` | Relative `callbackURL` |
| Web success, desktop still on login | Event drop / wrong `beforeLoad` / session cleared |
| `session.json` missing after 200 token | Cleared by failed `get-session` or wrong cookie encoding |
| Dashboard then `MISSING_OR_NULL_ORIGIN` | Deno fetch missing `Origin: com.tigawanna.tangerine:/` |
| Loopback rejected / paste works | Stale loopback port / orphan process / preload not restarted |
| `get-access-token` 400 | Wrong `accountId` (need row id from `list-accounts`) |

Optional: `DENO_DESKTOP_DEVTOOLS=1` (CEF backend) for webview DevTools.

---

## Key files

| Area | Path |
| --- | --- |
| API Better Auth | `apps/api/src/lib/auth.ts` |
| Web sign-in + loopback handoff | `apps/web/src/routes/auth/-components/GitHubSignIn.tsx` |
| Web “close this tab” after desktop handoff | `apps/web/src/routes/auth/desktop-done/index.tsx` |
| Deno PKCE / loopback / jar | `apps/desktop/deno/auth/` (`auth.ts` re-exports) |
| Deno window + bindings | `apps/desktop/deno/window.ts` |
| Desktop UI auth / dashboard guards | `apps/desktop/src/routes/auth/index.tsx`, `.../_dashboard/layout.tsx` |
| Protocol constants | `packages/auth/src/electron.ts` (`ELECTRON_PROTOCOL_SCHEME`, `ELECTRON_TRUSTED_ORIGIN`) |
| Electron main client | `apps/electron/src/main/lib/auth-client.ts` |
