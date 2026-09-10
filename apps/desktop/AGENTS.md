# Desktop (Deno Desktop + TanStack Start)

TanStack Start UI packaged with [`deno desktop`](https://docs.deno.com/runtime/desktop/). Auth is **system-browser OAuth** against `apps/api` (Better Auth `electron()` plugin) — GitHub secrets stay on the API, not in the desktop binary.

Shared monorepo rules: root [`AGENTS.md`](../../AGENTS.md).

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

Requires **Deno ≥ 2.9**. Config: [`deno.json`](./deno.json). Preload: [`deno/window.ts`](./deno/window.ts) + [`deno/auth/`](./deno/auth/) (barrel [`deno/auth.ts`](./deno/auth.ts)). Packaging / icons / `dist-desktop` glance: [`README.md`](./README.md).

| Command | What it does |
| --- | --- |
| `pnpm dev` (repo root) | Turbo: `api` + this app’s native `deno desktop --hmr` |
| `pnpm dev` (this package) | Native window + Vite HMR on **:3070** |
| `pnpm dev:vite` | Browser-only Vite on **:3070** (no native shell) |
| `pnpm desktop:build` | `vp build` then package into `dist-desktop/` |
| `pnpm desktop:run` | Run against existing `.output/` |
| `pnpm db:setup` | Push Drizzle schema + create vector ANN index |

Do **not** point Deno’s `task.dev` at `deno desktop` — HMR invokes `deno task dev` → `pnpm run dev:vite` and must not recurse.

## Local DB (Turso / libSQL)

Embedded **libSQL** via `@libsql/client` + Drizzle (`dialect: "turso"`) — not better-sqlite3. Needed for `F32_BLOB` vector columns / `libsql_vector_idx`.

| Piece | Path |
| --- | --- |
| Client | [`src/db/client.ts`](./src/db/client.ts) |
| Schema | [`src/db/schema/`](./src/db/schema/) (`project_repo_artifacts`, `project_enrichment_outputs`, `project_embeddings`) |
| Default file | `DATABASE_URL` or `~/.config/tangerine-desktop/tangerine.db` |

`pnpm db:push` then `pnpm db:ensure-vector` (or `pnpm db:setup`). Auth session cookies stay in JSON under `~/.config/tangerine-desktop/`; API auth tables remain on `apps/api`.

## OAuth (system browser + API)

Full guide (architecture, env, gotchas, debugging): [`docs/auth.md`](../../docs/auth.md).

Mirrors [Better Auth Electron](https://better-auth.com/docs/integrations/electron) without `@better-auth/electron` on the Deno side:

1. Deno runtime generates PKCE and starts a loopback on `127.0.0.1` (prefers `DESKTOP_AUTH_LOOPBACK_PORT` / `17832`). **Deno Desktop may remap the port** — the URL always uses the real `onListen` port. PKCE is also written under `~/.config/tangerine-desktop/`.
2. System browser opens `apps/web` `/auth` with `client_id`, `state`, `code_challenge`, and that loopback URL.
3. Web preserves PKCE on `signIn.social`, talks to **`apps/api`** (`electron()` + `electronProxyClient`).
4. After GitHub callback, web **fetches** the loopback URL with `?token=` (keeps the paste UI if the listener is down).
5. Deno exchanges via `POST /api/auth/electron/token`, stores session cookies under `~/.config/tangerine-desktop/`.
6. **Fallback:** paste the token shown on the web page.

`desktop.app.deepLinks` registers `com.tigawanna.tangerine` for later OS routing. Deno does **not** yet deliver `open-url` to JS ([discussion #36796](https://github.com/denoland/deno/discussions/36796)), so do not rely on the custom scheme for the return path today.

### Checklist

1. `apps/api` running with `electron()` and `BETTER_AUTH_TRUSTED_ORIGINS` including `com.tigawanna.tangerine:/` and `http://localhost:3064` / `3070`.
2. `apps/web` running; `VITE_API_URL` → API; `/auth` has proxy + loopback support.
3. Desktop `.env`: `VITE_APP_URL=http://localhost:3070`, `VITE_API_URL=http://localhost:5000` (API — token exchange), `VITE_SIGN_IN_URL=http://localhost:3064/auth`. Do **not** set `BETTER_AUTH_URL` to `:3070`. No GitHub secrets in desktop.
4. Restart desktop after env or `deno/*` changes (preload + env baked at compile time).

### Logging (evlog)

All local drains share monorepo [`.evlog/logs/`](../../.evlog/logs/):

| `service` | Source |
| --- | --- |
| `tangerine-desktop` | TanStack Start / Nitro inside the desktop app |
| `tangerine-desktop-runtime` | Deno preload OAuth (`deno/auth/`) |
| `tangerine-api` / `tangerine-web` | sibling apps (same folder) |

Filter by `service` / `action` (`desktop.auth.*`) when tracing OAuth. **Read:** latest monorepo `.evlog/logs/YYYY-MM-DD.jsonl` (NDJSON, one event per line); e.g. `rg 'tangerine-desktop|desktop.auth' .evlog/logs/`.

Optional: `DENO_DESKTOP_DEVTOOLS=1 pnpm desktop:dev`.

# Conventions

**Routes:** Folder + `index.tsx`. Thin file: `beforeLoad`, loader, compose. Prefix `-` to opt a folder out of the router.

**Auth:** Desktop session lives in the Deno runtime (bindings), not CEF cookies. Dashboard `beforeLoad` / GitHub token use `bindings.*` when present. Browser `pnpm dev` still uses local Better Auth cookies.

**Relay (dashboard only):** `/_dashboard` is `ssr: false`. Nested under `/$user`: profile, `repos`, `stars`. Run `pnpm relay` after GraphQL edits.

**Don't:** Bake GitHub client secrets into the desktop binary. Build OAuth solely on `deepLinks` until Deno delivers open-url. Commit `dist-desktop/`.
