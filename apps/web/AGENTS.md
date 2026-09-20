TanStack Start app. Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md).

List / search / pagination: repo root [`docs/backstage-list-pattern.md`](../../docs/backstage-list-pattern.md).

<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# Conventions

**Routes:** Folder + `index.tsx`. Thin file: `beforeLoad`, loader, compose. Prefix `-` to opt a folder out of the router.

**Auth:** GitHub OAuth via **`apps/api`** Better Auth. Web exposes same-origin `/api/*` (Nitro `routeRules` / `vercel.json` → `VITE_API_URL`) so cookies are first-party. Client: `@/lib/auth-client` with `baseURL: VITE_APP_URL`. Session: `authClient.getSession()` / `getSession()` in `beforeLoad`. Desktop/Electron browser half: `electronProxyClient` + PKCE query + `loopback` / `ensureElectronRedirect`. Deep dive: [`docs/auth.md`](../../docs/auth.md).

**Logging (evlog):** Dev Nitro FS drain → monorepo [`.evlog/logs/`](../../.evlog/logs/) (`service: tangerine-web`). Client Vite plugin uses the same service name. **Read:** latest `.evlog/logs/YYYY-MM-DD.jsonl` (NDJSON); `rg '"service":"tangerine-web"' .evlog/logs/`.

**API:** Browser calls `VITE_APP_URL/api…` (proxied to Hono). `VITE_API_URL` is proxy upstream only (`:5000` locally). OAuth secrets live on the API; GitHub callback is the **web** origin: `{BETTER_AUTH_URL}/api/auth/callback/github` with `BETTER_AUTH_URL` = `VITE_APP_URL`.

**Desktop OAuth (browser half):** `/auth` preserves PKCE, uses `transferUser` + `loopback` for Deno Desktop (or `ensureElectronRedirect` for Electron scheme).

**Deploy (Vercel):** Root = `apps/web`. Proxy + Turso + Hono packing details: [`docs/vercel-deploy.md`](../../docs/vercel-deploy.md). Set `VITE_APP_URL` (web) + `VITE_API_URL` (API upstream). API project `BETTER_AUTH_URL` must be the **web** URL. Auth secrets stay on the API.

**Relay (dashboard only):** `/_dashboard` is `ssr: false`. `beforeLoad` sets `githubLogin` + a **stable** Relay `Environment` on context. `/viewer` is the post-login entry and redirects to `/$user` with that login. Nested under `/$user`: profile index, `repos`, `stars`. Layout `loadQuery`; children `usePreloadedQuery`. Run `pnpm relay` after GraphQL edits.

**Do:** `beforeLoad` + `redirect()` for auth. Route UI in `-components/`. Nest user-scoped pages under `/$user/...`. Sidebar hrefs include the active login.

**Don't:** Put a top-level `/$user` sibling that steals `/repos` — nest those under `$user`. Create a new Relay `Environment` per navigation. Invent a `/u` prefix. Use Relay outside `/_dashboard`.
