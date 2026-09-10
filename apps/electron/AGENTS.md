# Electron (electron-vite)

Blank Electron shell. Auth is Better Auth Electron against `apps/api` (GitHub OAuth
secrets stay on the API). The system browser opens the web `/auth` page; deep link
`com.tigawanna.tangerine://` returns the session to the main process.

Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md). Auth deep dive: [`docs/auth.md`](../../docs/auth.md).

Docs: [Better Auth Electron](https://better-auth.com/docs/integrations/electron) · [electron-vite](https://electron-vite.org/)

## Commands

| Command | What it does |
| --- | --- |
| `pnpm --filter electron dev` | electron-vite dev (main + preload + renderer HMR) |
| `pnpm --filter electron build` | typecheck + production build to `out/` |
| `pnpm --filter electron build:linux` | package with electron-builder |

## Auth checklist

1. API running with `electron()` plugin (`apps/api`).
2. `BETTER_AUTH_TRUSTED_ORIGINS` includes `com.tigawanna.tangerine:/`.
3. Web `/auth` has `electronProxyClient` + `ensureElectronRedirect` (PKCE query preserved).
4. Web `VITE_API_URL` points at the API when testing Electron sign-in (same Better Auth server).
5. Electron `.env`: `MAIN_VITE_BETTER_AUTH_URL` (API) + `MAIN_VITE_SIGN_IN_URL` (web `/auth`).

**Do:** Keep `authClient` in the main process only; use preload bridges in the renderer. Never put GitHub client secrets in Electron.

**Don't:** Reintroduce Deno Desktop, expose tokens/cookies to the renderer, or set `nodeIntegration: true`.
