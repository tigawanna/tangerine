# Desktop (Deno Desktop + TanStack Start)

TanStack Start app packaged with [`deno desktop`](https://docs.deno.com/runtime/desktop/). Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md).

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

# Deno Desktop

Requires **Deno ≥ 2.9**. Config lives in [`deno.json`](./deno.json) (`desktop` block). Single window bootstrap: [`deno/window.ts`](./deno/window.ts) (passed as `--preload`).

| Command | What it does |
| --- | --- |
| `pnpm desktop:dev` | `deno desktop --hmr` — TanStack Start / Vite HMR in one native window |
| `pnpm desktop:build` | `vp build` then package a redistributable binary into `dist-desktop/` |
| `pnpm desktop:run` | Package + run without HMR (uses existing `.output/` if already built) |
| `pnpm dev` | Browser-only Vite/Nitro on port **3065** (no native shell) |

Do **not** add a Deno `task` named `dev` that wraps `deno desktop` — framework HMR may invoke the project `dev` script and recurse.

Optional: `DENO_DESKTOP_DEVTOOLS=1 pnpm desktop:dev` opens Deno + renderer DevTools.

**OAuth (required for GitHub sign-in):** Better Auth stores the OAuth state in a cookie. That cookie and the GitHub callback must share the **same cookie jar** (the desktop window). Use the **CEF** backend (set in `deno.json`) so GitHub stays in-window — OS WebView on Linux often opens Chrome externally, which causes `State mismatch: auth state cookie not found`.

Checklist:
1. `VITE_APP_URL`, `VITE_API_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_TRUSTED_ORIGINS` are all `http://localhost:3065` (same origin, no trailing slash).
2. GitHub OAuth App callback is exactly `http://localhost:3065/api/auth/callback/github` (separate OAuth app from `apps/web` if web still uses `:3064`).
3. Restart `pnpm desktop:dev` after env **or** `deno/window.ts` changes (preload + env are baked at desktop compile time).
4. Sign-in uses `bindings.navigate` (see `GitHubSignIn` + `deno/window.ts`) so GitHub stays in-window. If Chrome still opens, the old desktop process was not restarted.

Do **not** construct a second `Deno.BrowserWindow` unless you intentionally want multi-window. The first construction adopts the implicit startup window.

Framework detection picks up `@tanstack/react-start` automatically; `--preload` only configures the window. See [Frameworks](https://docs.deno.com/runtime/desktop/frameworks/) and [HMR](https://docs.deno.com/runtime/desktop/hmr/).

# Conventions

**Routes:** Folder + `index.tsx`. Thin file: `beforeLoad`, loader, compose. Prefix `-` to opt a folder out of the router.

**Auth:** GitHub OAuth only, from `@repo/auth`. Protect dashboards with `beforeLoad` + `redirect()` to `/auth`. Server singleton is `getAuth()` in `src/lib/auth.server.ts`. React client is `@/lib/auth-client`. Desktop OAuth must use whatever origin the embedded server binds to (see `.env` / `BETTER_AUTH_*`).

**Relay (dashboard only):** `/_dashboard` is `ssr: false`. `beforeLoad` sets `githubLogin` + a **stable** Relay `Environment` on context. `/viewer` is the post-login entry and redirects to `/$user` with that login. Nested under `/$user`: profile index, `repos`, `stars`. Layout `loadQuery`; children `usePreloadedQuery`. Run `pnpm relay` after GraphQL edits.

**Do:** `beforeLoad` + `redirect()` for auth. Route UI in `-components/`. Nest user-scoped pages under `/$user/...`. Sidebar hrefs include the active login.

**Don't:** Put a top-level `/$user` sibling that steals `/repos` — nest those under `$user`. Create a new Relay `Environment` per navigation. Invent a `/u` prefix. Use Relay outside `/_dashboard`. Commit `dist-desktop/` or leftover `desktop/` build dumps.
