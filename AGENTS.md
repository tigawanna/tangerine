# Workspace

pnpm + Turbo monorepo. **Stack- and app-specific rules live in nested `AGENTS.md` files — read the nearest one before editing that package.** Root rules below are shared across apps.

## Apps

- `apps/web` — TanStack Start (GitHub dashboard). See [`apps/web/AGENTS.md`](apps/web/AGENTS.md).

Shared libraries live in `packages/*`. Auth is [`packages/auth`](packages/auth/AGENTS.md) (GitHub-only Better Auth, cookie session, no database).

Add a new app under `apps/<name>/` with its own `AGENTS.md` when the stack or product conventions differ (e.g. Next.js, Expo, Deno).

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Pre-commit already formats and lints. After big changes: `pnpm quality && pnpm check-types`.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Conventions

**Code:** React 19 Compiler — no `useMemo` / `useCallback` / `React.memo`. `@/` imports. `satisfies`. Zod v4 (`z.email()` / `z.url()`). JSDoc on utils. No `any` or type-hiding casts. `catch` is `unknown`.

**Control flow:** Prefer early returns over nested `if`s and JSX ternary soup. Guard pending/empty/error first, then the happy path. One-line `cond ? a : b` is fine; stacked ternaries in JSX are not — extract a helper or early-return.

**UI:** shadcn. DaisyUI only for theme tokens, `btn` classes, or tiny standalone bits. Theme tokens, no hardcoded colors. Responsive (`md:`, `lg:`). `data-test` on interactive UI.

**Files:** Thin entry files. Colocate feature UI with the feature, not in global `components/`. `components/ui/` is shadcn codegen only. Routing and folder conventions for an app are in that app’s `AGENTS.md`.
