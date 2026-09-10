# Tangerine Desktop (Deno Desktop)

TanStack Start UI in a native window on **:3070**. **OAuth uses the system browser** against `apps/api` — secrets stay on the API.

Requires **Deno ≥ 2.9**. Also run `apps/api` + `apps/web` (`:3064`) for sign-in.

## Commands

From repo root (API + desktop native shell):

```bash
pnpm dev
```

Or from `apps/desktop`:

```bash
pnpm dev             # deno desktop --hmr (native window)
pnpm dev:vite        # browser-only Vite on :3070
pnpm desktop:run     # against existing .output/
pnpm desktop:build   # package into dist-desktop/
```

Web alone: `pnpm dev:web` · Everything: `pnpm dev:all`

Copy `.env.example` → `.env`. Point `VITE_API_URL` at the API and `VITE_SIGN_IN_URL` at web `/auth`.

See [`AGENTS.md`](./AGENTS.md) for the OAuth loopback / paste flow.
