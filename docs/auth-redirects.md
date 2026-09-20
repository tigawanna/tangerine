# Auth redirects (Better Auth + split API + desktop)

Copy-paste reference for another project. Browser cookies must be first-party; desktop can hit the API host directly.

## Layout

- `web` — UI + same-origin `/api` proxy
- `api` — Better Auth + DB (Hono, etc.)
- `desktop` — system browser for OAuth, then token exchange against `api`

## Browser (required on Vercel / different hosts)

Problem: web and api on different hosts (e.g. two `*.vercel.app` URLs) cannot share cookies. OAuth state cookie set on api is blocked as third-party -> `state_security_mismatch`.

Fix:

1. Proxy `web/api/*` -> `api/api/*` (Nitro routeRules, vercel.json rewrite, or equivalent).
2. Auth client `baseURL` = web origin (not api).
3. `BETTER_AUTH_URL` = web origin (not api).
4. GitHub callback = `{BETTER_AUTH_URL}/api/auth/callback/github` (web URL).

Browser flow:

sign-in on web -> POST web/api/auth/... -> proxy -> api  
-> redirect GitHub -> callback web/api/auth/callback/... -> proxy -> api  
-> Set-Cookie on web host -> redirect to app callbackURL

Local: web `:3064`, api `:5000`, still proxy `/api` so cookies stay on `:3064`.

## Env

| Where | Var | Value |
| --- | --- | --- |
| api | `BETTER_AUTH_URL` | web public URL |
| api | trusted origins | web (+ desktop scheme if any) |
| web | app URL | web public URL (auth client base) |
| web | api URL | api origin (proxy target only) |
| GitHub OAuth app | callback | `{web}/api/auth/callback/github` |

Wrong: `BETTER_AUTH_URL` = api hostname while the browser talks to web.

## Desktop (Deno / Electron)

Desktop does not need the cookie proxy for its own session.

1. App opens system browser to web `/auth` with PKCE (`state`, `code_challenge`, `loopback`).
2. User signs in on web (same proxy flow as above).
3. Web hands token to desktop loopback (`?token=`) or custom scheme.
4. Desktop `POST` api `/api/auth/electron/token` with Bearer / Origin — talk to api host directly.
5. Persist session on disk / main process; webview is UI only.

Rules:

- `callbackURL` after social login must be absolute web URL (relative resolves against `BETTER_AUTH_URL`).
- Loopback token in query string, not hash.
- Cookie-bearing POSTs from desktop need a trusted `Origin` (e.g. `com.app:/`).
- Prefer Bearer (raw session token) over replaying signed cookies.

## Do / don't

Do: proxy `/api` on web; point Better Auth base URL at web; register GitHub callback on web.  
Don't: set auth cookies on a different site than the page; use relative post-login paths; clear desktop session on soft get-session failures.

## Symptoms

| See | Check |
| --- | --- |
| `state_security_mismatch` | proxy + `BETTER_AUTH_URL` = web |
| lands on api `/?error=...` | `BETTER_AUTH_URL` still api |
| lands on api `/viewer` | relative `callbackURL` |
| desktop UI still logged out | bindings/session jar, not webview cookies |
