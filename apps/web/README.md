# `web` — Tangerine dashboard

TanStack Start app: public landing page + signed-in GitHub dashboard. Shared monorepo rules live in the root [`README.md`](../../README.md) and [`AGENTS.md`](../../AGENTS.md).

## What lives here

| Area                    | Notes                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `/`                     | Public landing page, prerendered at build time                           |
| `/auth`                 | GitHub sign-in, plus the browser half of desktop OAuth (PKCE + loopback) |
| `/og`                   | On-demand OG image generation with Takumi                                |
| `/_dashboard`           | Client-only GitHub SPA; session gate in `beforeLoad`                     |
| `/_dashboard/$user/...` | Profile, repos, repo detail, stars, followers, following, search         |

## Data flow

- **GitHub data:** Relay → GitHub GraphQL, using the signed-in user's OAuth token.
- **Session + token:** Better Auth client → same-origin `/api/auth` → `apps/api`.
- **Other server work:** TanStack Start server functions in `src/data-access-layer/`.
- **Typed API calls:** `hc<AppType>` from `src/lib/api/client.ts`.

## Auth requirements

- `VITE_APP_URL` is the web origin and the auth client base (`http://localhost:3064`).
- `VITE_API_URL` is only the proxy upstream (`http://localhost:5000`).
- Nitro proxies `/api/**` to the API so OAuth cookies stay first-party.
- The GitHub callback must be `{VITE_APP_URL}/api/auth/callback/github`.
- Never put GitHub or Better Auth secrets in this app.

## Commands

```bash
pnpm --filter web dev        # http://localhost:3064
pnpm --filter web build
pnpm --filter web check-types
pnpm --filter web relay      # after GraphQL edits
pnpm --filter web test
```

## Gotchas

- Keep the Relay `Environment` stable across dashboard navigations; a new one per route breaks `loadQuery` + `usePreloadedQuery`.
- Keep search/filter chrome outside Suspense boundaries so the controls do not unmount on navigation.
- Route search schemas stay flat and optional; apply defaults in a resolver, not in `validateSearch`.
