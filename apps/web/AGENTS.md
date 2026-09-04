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

**Do:** `beforeLoad` + `redirect()` for auth. Route UI in `-components/`. Defaults on `validateSearch` — after parse use `search.page` / `search.q` directly. `queryOptions` + `useSuspenseQuery` in the component. Mutations: `meta.invalidates`, `onError(err: unknown)`.

**Don't:** Skip `beforeLoad` on protected routes. Put route UI in the route file or global `components/`. Wrap every query in `useX`. `qc.invalidateQueries` when `meta.invalidates` exists. Re-default search (`search.page ?? 1`) in the list. Invent a Next `app/` tree here.
