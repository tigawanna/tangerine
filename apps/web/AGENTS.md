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

**Relay (dashboard only):** `/_dashboard` is `ssr: false`. `beforeLoad` sets `githubLogin` + a **stable** Relay `Environment` on context. `/viewer` is the post-login entry and redirects to `/$user` with that login. Nested under `/$user`: profile index, `repos`, `stars`. Layout `loadQuery`; children `usePreloadedQuery`. Run `pnpm relay` after GraphQL edits.

**Do:** `beforeLoad` + `redirect()` for auth. Route UI in `-components/`. Nest user-scoped pages under `/$user/...`. Sidebar hrefs include the active login.

**Don't:** Put a top-level `/$user` sibling that steals `/repos` — nest those under `$user`. Create a new Relay `Environment` per navigation. Invent a `/u` prefix. Use Relay outside `/_dashboard`.
