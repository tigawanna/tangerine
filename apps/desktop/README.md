# Tangerine Desktop (Deno Desktop)

TanStack Start GitHub dashboard wrapped with [`deno desktop`](https://docs.deno.com/runtime/desktop/). Framework auto-detection picks up `@tanstack/react-start`.

Requires **Deno ≥ 2.9**.

## Commands

```bash
# From apps/desktop
pnpm desktop:dev     # native window + Vite HMR (CEF)
pnpm desktop:run     # native window against existing .output/ build
pnpm desktop:build   # vp build + package into dist-desktop/
pnpm dev             # browser-only on http://localhost:3065
```

Copy `.env.example` → `.env` and point all origins at `http://localhost:3065`. GitHub OAuth callback: `http://localhost:3065/api/auth/callback/github`.

See [`AGENTS.md`](./AGENTS.md) for OAuth / CEF notes.
