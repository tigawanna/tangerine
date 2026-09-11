# Tangerine Desktop (Deno Desktop)

TanStack Start in a native window. **OAuth uses the system browser** against `apps/api` — secrets stay on the API.

Requires **Deno ≥ 2.9**. For sign-in also run `apps/api` (`:5000`) + `apps/web` (`:3064`).

Official Deno docs: [Desktop](https://docs.deno.com/runtime/desktop/) · [Configuration](https://docs.deno.com/runtime/desktop/configuration/) · [Distribution](https://docs.deno.com/runtime/desktop/distribution/) · [Backends](https://docs.deno.com/runtime/desktop/backends/) · [Frameworks](https://docs.deno.com/runtime/desktop/frameworks/)

Auth deep dive: [`docs/auth.md`](../../docs/auth.md) · agent notes: [`AGENTS.md`](./AGENTS.md)

---

## Quick commands

| Command                | What                                        |
| ---------------------- | ------------------------------------------- |
| `pnpm dev` (repo root) | Turbo: API + this native shell              |
| `pnpm dev` (here)      | `deno desktop --hmr` → UI on **:3070**      |
| `pnpm dev:vite`        | Browser-only Vite (no native window)        |
| `pnpm desktop:build`   | `vp build` then package → `dist-desktop/`   |
| `pnpm desktop:run`     | Run packaged / existing `.output/`          |
| `pnpm db:setup`        | Push Turso/libSQL schema + vector ANN index |

Copy `.env.example` → `.env`. Set `VITE_API_URL` → API, `VITE_SIGN_IN_URL` → web `/auth`. For local vectors: `DATABASE_URL=file:local.db` then `pnpm db:setup`.

---

## Layout (where things live)

```
apps/desktop/
├── deno.json              # desktop.app / icons / backend / output paths
├── deno/
│   ├── window.ts          # preload: BrowserWindow + bindings
│   ├── auth.ts            # public re-exports
│   └── auth/              # PKCE, loopback, session jar (split modules)
├── public/                # Vite public assets + app icons (source)
│   ├── icon.png           # Linux (+ macOS today)
│   └── favicon.ico        # Windows
├── src/                   # TanStack Start UI
├── .output/               # `vp build` / Nitro output (embedded into the binary)
└── dist-desktop/          # packaged desktop app (do not commit)
```

| Asset                          | Role                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `public/*`                     | Served by Vite in dev; icons also referenced from `deno.json`                          |
| `.output/`                     | Framework build that `deno desktop` **embeds** in the VFS and self-extracts at runtime |
| `~/.config/tangerine-desktop/` | Runtime session + PKCE (`session.json`, `pkce.json`) — not the app binary              |
| `<deno_dir>/`                  | Cached CEF/webview/denort downloads (Deno-managed)                                     |

**cwd note:** the compiled binary’s process cwd is the user’s cwd, not the binary folder. Framework outputs are resolved via the embedded VFS — don’t assume `Deno.cwd()` points at the install dir.

---

## Icons

Configured in [`deno.json`](./deno.json) → `desktop.app.icons` (paths relative to `deno.json`):

| Platform | Current path           | Docs prefer                                 |
| -------- | ---------------------- | ------------------------------------------- |
| Linux    | `./public/icon.png`    | PNG (or multi-size PNG array)               |
| macOS    | `./public/icon.png`    | `.icns`, or PNG array with `{ path, size }` |
| Windows  | `./public/favicon.ico` | `.ico`                                      |

- Missing icon for a platform → Deno’s default icon.
- Paths must exist at build time or `deno desktop` fails validation.
- `.icns` / `.ico` pass through; PNGs are assembled into the platform container.
- Multi-res example (from Deno docs):

```jsonc
"macos": [
  { "path": "./public/icons/16.png", "size": 16 },
  { "path": "./public/icons/32.png", "size": 32 },
  { "path": "./public/icons/128.png", "size": 128 },
  { "path": "./public/icons/256.png", "size": 256 },
  { "path": "./public/icons/512.png", "size": 512 }
]
```

Packaged names: macOS `Contents/Resources/icon.icns` · Windows `AppIcon.ico` · Linux `AppIcon.png`.

---

## Built binary / output

`desktop.output` in `deno.json`:

| OS      | Path                           | Shape                        |
| ------- | ------------------------------ | ---------------------------- |
| Linux   | `./dist-desktop/tangerine`     | App dir + launcher script    |
| macOS   | `./dist-desktop/Tangerine.app` | `.app` bundle                |
| Windows | `./dist-desktop/Tangerine`     | Dir + `.bat` launcher + DLLs |

**Priority:** `--output` CLI > `desktop.output` > project name default.

Our `pnpm desktop:build` currently passes `-o ./dist-desktop/tangerine` (overrides per-OS paths for that run).

Extension picks the **format** (Deno docs):

| Want                       | Set output to                                    |
| -------------------------- | ------------------------------------------------ |
| macOS DMG                  | `…/Tangerine.dmg` (needs macOS host / `hdiutil`) |
| Windows MSI                | `…/Tangerine.msi`                                |
| Linux AppImage / deb / rpm | `….AppImage` / `.deb` / `.rpm`                   |

Optional: `deno desktop --compress` (or `xz` / `zstd`) for a smaller self-extracting payload.

Cross-compile: `--target <triple>` or `--all-targets`. Backend/runtime archives download into Deno’s cache.

---

## Backend (webview vs CEF)

|           | `webview` (default)                        | `cef`                       |
| --------- | ------------------------------------------ | --------------------------- |
| Engine    | OS webview (WebKit / WebView2 / WebKitGTK) | Bundled Chromium            |
| Size      | Smaller (~40–70 MB class)                  | Larger (~150 MB+ framework) |
| Rendering | Varies by OS                               | Identical everywhere        |
| DevTools  | Not via Deno mux yet                       | Supported                   |

Set in `deno.json` → `desktop.backend`, or override with `--backend=cef|webview`.

**Auth does not depend on CEF** — OAuth is system browser + Deno preload. Same `bindings` / `navigate` / `executeJs` on both.

Scripts follow `deno.json` (`webview` by default). Override with `--backend=cef` when you need bundled Chromium / DevTools.

---

## Identity & deep links

From `desktop.app` in `deno.json`:

- **name** — window / menu / taskbar label (`Tangerine`)
- **identifier** — `com.tigawanna.tangerine` (bundle id / AppUserModelID)
- **deepLinks** — registers scheme `com.tigawanna.tangerine` at package time

Scheme registration ≠ delivery: Deno does not yet hand `open-url` to JS, so login return uses **loopback**, not the custom scheme.

---

## Preload

`--preload ./deno/window.ts` runs before the UI: creates `Deno.BrowserWindow`, starts auth loopback, exposes `bindings` to the webview. **Restart the app** after editing `deno/*` or `.env` — preload is not HMR’d.
