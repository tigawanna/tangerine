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

**Auth:** GitHub OAuth only, from `@repo/auth`. Protect dashboards with `beforeLoad` + `redirect()` to `/auth`. Server singleton is `getAuth()` in `src/lib/auth.server.ts`. React client is `@/lib/auth-client`.

**Relay (dashboard only):** `/_dashboard` is `ssr: false`. `beforeLoad` loads session (`githubLogin` from `user.githubUsername`) + GitHub OAuth token via `authClient.getAccessToken({ useAccountCookie: true })`, builds a client Relay `Environment`, and puts both on router context. Wrap UI with `RelayEnvironmentProvider`. Profile data: `/viewer` redirects to `/$user` with that login; `/$user` layout `loadQuery`s `layoutUserPageLoaderQuery` and children use `usePreloadedQuery`. Run `pnpm relay` / `pnpm relay:watch` after changing GraphQL. Schema: `packages/github/schema.graphql`.

**Do:** `beforeLoad` + `redirect()` for auth. Route UI in `-components/`. Defaults on `validateSearch` — after parse use `search.page` / `search.q` directly. For dashboard GraphQL: `loadQuery` in loaders + `usePreloadedQuery` (or fragments). Mutations: `meta.invalidates`, `onError(err: unknown)` when still on React Query.

**Don't:** Skip `beforeLoad` on protected routes. Put route UI in the route file or global `components/`. Duplicate a separate GraphQL `viewer` query when `githubLogin` + `user(login:)` already covers "me". Wrap every query in `useX`. `qc.invalidateQueries` when `meta.invalidates` exists. Re-default search (`search.page ?? 1`) in the list. Invent a Next `app/` tree here. Use Relay outside `/_dashboard` or enable SSR for Relay routes without a server Relay story.
