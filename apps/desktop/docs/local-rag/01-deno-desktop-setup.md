# Bulding a local RAG tool with Deno Desktop 


## Deno desktop

[Deno Desktop](https://docs.deno.com/runtime/desktop/) (`deno desktop`, Deno ≥ 2.9) packages a web app together with the Deno runtime and a rendering engine into one binary per platform.

Point it at a project directory and it [auto-detects the framework](https://docs.deno.com/runtime/desktop/frameworks/): Next.js, Astro, Nuxt, SvelteKit, SolidStart, TanStack Start, and several more. It embeds the build output and runs the framework's own production server (or its dev server under `--hmr`), with the webview pointed at it:

```bash
deno desktop --hmr .             # dev: framework dev server + native window
deno desktop -o ./dist/myapp .   # package: one binary for this platform
```

### Server code just runs, no IPC

A sweet feature is how **server-side code runs in the Deno runtime automatically, with no IPC**. In Electron you split code into "main" and "renderer" and wire channels between them:

```ts
// Electron: main process
ipcMain.handle("read-notes", () => fs.readFile(notesPath, "utf8"));

// Electron: preload, to expose it safely
contextBridge.exposeInMainWorld("api", { readNotes: () => ipcRenderer.invoke("read-notes") });

// Electron: renderer
const notes = await window.api.readNotes();
```

With `deno desktop`, the framework server _is_ the backend. A TanStack Start [server function](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions) (or a Next.js server action) does the same job in one place:

```ts
// Deno Desktop + TanStack Start: runs in the Deno runtime, called from React like a function
export const readNotes = createServerFn().handler(() => fs.readFile(notesPath, "utf8"));

const notes = await readNotes();
```

[Server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) work the same way. With full Node compat, `node:fs`, `node:child_process`, native npm modules like `onnxruntime-node`, and embedded Postgres ([PGlite](https://pglite.dev/docs/)) all run right next to your UI code.

For a local RAG tool that matters a lot. Fetching from GitHub, running an ONNX embedding model, and writing to a vector index are all "server" work, and we want it in plain TypeScript next to the routes that trigger it.

### Bindings for the truly native bits

For the handful of things that really are native (window, menus, the OS browser for OAuth), Deno Desktop has [bindings](https://docs.deno.com/runtime/desktop/bindings/). A function bound on the Deno side shows up on a global `bindings` object in the webview, through in-process channels rather than socket IPC:

```ts
// Deno side (preload)
win.bind("openExternal", (url: string) => openInSystemBrowser(url));

// webview side
await bindings.openExternal("https://github.com/login");
```

The real versions are in [the preload section](#the-preload-native-window--bindings) below.

### Why TanStack Start fits

TanStack Start builds with Nitro into `.output/server/index.*`, which is exactly the entry `deno desktop` looks for:

```text
vp build
  └── .output/
      ├── public/          static assets
      └── server/index.mjs  <- deno desktop finds and runs this
```

Everything else is a normal TanStack Start app, so the same code also runs in a browser tab (`pnpm dev:vite`) for fast UI iteration.

## Monorepo layout

`apps/desktop` sits in the pnpm + Turbo monorepo next to `apps/api` (Better Auth + Turso) and `apps/web` (the browser dashboard and the OAuth `/auth` page). Shared code lives in `packages/*`.

```text
apps/desktop/
├── deno.json              # desktop.app identity, icons, backend, output paths
├── package.json           # dev / build / package scripts
├── vite.config.ts         # TanStack Start + Nitro + React Compiler + Relay
├── nitro.config.ts        # Nitro server (evlog drain)
├── deno/                  # Deno-side preload (NOT bundled by Vite)
│   ├── window.ts          # BrowserWindow + bindings exposed to the webview
│   ├── menu.ts            # native application menu
│   └── auth/              # PKCE, loopback server, session jar (chapter 2)
├── src/                   # TanStack Start app
│   ├── routes/            # file-based routes (UI + server routes)
│   │   └── api/elysia/$.ts  # Elysia mounted as a catch-all server route
│   ├── elysia/            # embedded Elysia API + Eden treaty client
│   ├── pglite/            # local Postgres + pgvector (Drizzle)
│   ├── lib/pub-sub/       # in-process pub/sub that feeds SSE
│   └── hooks/use-*-sse.ts # React hooks that consume SSE streams
├── .output/               # `vp build` output, embedded into the binary
└── dist-desktop/          # packaged app (never committed)
```

Shared packages used here:

| Package                 | Role                                                      |
| ----------------------- | --------------------------------------------------------- |
| `@repo/auth`            | GitHub-only Better Auth pieces (wired up in chapter 2)    |
| `@repo/github`          | GitHub REST/GraphQL client for repos and stars            |
| `@repo/gemma-embedding` | EmbeddingGemma ONNX pipeline (chapter 3)                  |

The local data lives in the user's config directory, not in the repo: PGlite data at `~/.config/tangerine-desktop/pgdata` (or `DATABASE_URL`), plus session JSON and the job-queue SQLite files.

## `deno.json`: identity, backend, output

The `desktop` block in [`deno.json`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno.json) holds all the desktop-specific config ([docs](https://docs.deno.com/runtime/desktop/configuration/)):

```json
{
  "nodeModulesDir": "manual",
  "unstable": ["sloppy-imports"],
  "imports": {
    "@/": "./src/",
    "@api/": "../api/src/"
  },
  "tasks": {
    "dev": "pnpm run dev:vite",
    "build": "pnpm run build"
  },
  "desktop": {
    "app": {
      "name": "Tangerine",
      "identifier": "com.tigawanna.tangerine",
      "deepLinks": ["com.tigawanna.tangerine"],
      "icons": {
        "linux": "./public/icon.png",
        "macos": "./public/icon.png",
        "windows": "./public/favicon.ico"
      }
    },
    "backend": "webview", // we save like 100 extra mbs by not using the CEF which embeds a chromiu
    "output": {
      "linux": "./dist-desktop/tangerine",
      "macos": "./dist-desktop/Tangerine.app",
      "windows": "./dist-desktop/Tangerine"
    }
  }
}
```
****
A few things are not obvious:

- **`nodeModulesDir: "manual"`**: pnpm owns `node_modules`. Deno reads it and never installs into it.
- **`imports`** mirrors the Vite `@/` alias so the same imports resolve under both Deno and Vite.
- **`tasks.dev` must point at Vite, not at `deno desktop`.** Under `--hmr`, Deno Desktop runs the framework dev server by calling `deno task dev`. If that task started `deno desktop` again, it would recurse.
- **`backend: "webview"`** uses the OS webview (WebKitGTK / WebKit / WebView2) for small binaries. Switch to `cef` (bundled Chromium) with `--backend=cef` when you need identical rendering or DevTools. See [Backends](https://docs.deno.com/runtime/desktop/backends/).
- **`deepLinks`** registers the custom scheme when the app is packaged, but Deno does not yet deliver `open-url` to JS, so OAuth returns through a loopback server instead (chapter 2).

## Dev loop: HMR, ports, env

The scripts in [`package.json`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/package.json):

```json
{
  "dev": "NODE_OPTIONS='--dns-result-order=ipv4first --no-network-family-autoselection' DENO_DESKTOP_DEVTOOLS=1 deno desktop --hmr --preload ./deno/window.ts --env-file=.env -A .",
  "dev:vite": "vp dev --port 3070 --host",
  "desktop:build": "pnpm run build && deno desktop --preload ./deno/window.ts --env-file=.env --no-check --node-modules-dir=none --exclude-unused-npm --exclude ./.output/server/node_modules/onnxruntime-node --compress -A -o ./dist-desktop/tangerine ."
}
```

| Command                   | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `pnpm dev` (repo root)    | Turbo: `apps/api` + this app's native `deno desktop --hmr`     |
| `pnpm dev` (this package) | Native window, Vite dev server with HMR on **:3070**           |
| `pnpm dev:vite`           | Same app in a normal browser tab on **:3070**, no native shell |
| `pnpm desktop:build`      | `vp build` → `.output/`, then package into `dist-desktop/`     |
| `pnpm desktop:run`        | Run the native shell against an existing `.output/`            |

What the flags do:

- **`--hmr`**: runs the framework's own dev server, so React fast refresh works inside the native window just like in a browser ([HMR docs](https://docs.deno.com/runtime/desktop/hmr/)). The Deno runtime and webview stay alive across edits.
- **`--preload ./deno/window.ts`**: runs our Deno-side code before the UI loads (next section). Preload is **not** hot-reloaded. Restart after editing `deno/*`.
- **`--env-file=.env`**: env is read once at startup, so restart after changing `.env` too.
- **`-A`**: all permissions. Bindings and server code inherit the runtime's permissions, and desktop apps usually ship with broad ones baked in.
- **`NODE_OPTIONS=...ipv4first`**: avoids `localhost` resolving to `::1` while the API listens on IPv4.
- **`DENO_DESKTOP_DEVTOOLS=1`**: the preload opens DevTools when this is set.
- **Packaging flags** (`--exclude-unused-npm`, `--exclude …onnxruntime-node`, `--compress`) keep the binary small. `deno desktop` does **not** run your framework build, which is why `desktop:build` runs `pnpm run build` first.

Env basics (see [`.env.example`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/.env.example)):

```bash
VITE_APP_URL=http://localhost:3070          # the desktop UI itself
VITE_API_URL=http://localhost:5000          # apps/api (auth + token exchange)
VITE_SIGN_IN_URL=http://localhost:3064/auth # apps/web sign-in page, opened in the system browser
DATABASE_URL=./pgdata                       # PGlite dir, relative to ~/.config/tangerine-desktop/
```

No GitHub client secrets ever go in this file. They stay on `apps/api`.

## The preload: native window + bindings

[`deno/window.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/window.ts) is the only "main process"-style code we write. It takes over the startup window, installs the menu, and exposes a small set of functions to the webview:

```ts
/// <reference lib="deno.ns" />
/// <reference lib="deno.desktop" />

const win = new Deno.BrowserWindow({
  title: "Tangerine",
  width: 1280,
  height: 840,
  resizable: true,
});

installApplicationMenu(win);

win.bind("openExternal", async (url: string) => {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("openExternal(url) requires a non-empty string");
  }
  await openExternal(url);
});

win.bind("getSession", async () => {
  return await getSession();
});

if (Deno.env.get("DENO_DESKTOP_DEVTOOLS") === "1") {
  win.openDevtools();
}
```

On the React side, [`src/lib/desktop-bindings.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/lib/desktop-bindings.ts) types the `bindings` proxy. Deno gives you no type bridge between the two realms, so we declare one ourselves. We also feature-detect it so the same UI still works in a plain browser tab:

```ts
declare global {
  // Deno Desktop injects this proxy into the renderer.
  var bindings: DesktopBindings | undefined;
}

/** True when running inside a `deno desktop` webview with bindings available. */
export function hasDesktopBindings(): boolean {
  return typeof globalThis.bindings?.requestAuth === "function";
}
```

Rule of thumb: **bindings are for things only the native shell can do** (window, menus, OS browser, the auth session). Everything else (GitHub fetches, embeddings, database, SSE) goes through normal TanStack Start server code, which already runs in Deno.

Related docs: [Windows](https://docs.deno.com/runtime/desktop/windows/) · [Menus](https://docs.deno.com/runtime/desktop/menus/) · [Bindings](https://docs.deno.com/runtime/desktop/bindings/).

## Server functions just work

Because the Nitro server runs inside the Deno runtime, a TanStack Start server function can use Node APIs, the local database, or the GitHub token directly. From [`src/data-access-layer/github/repos.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/data-access-layer/github/repos.ts):

```ts
export const getPinnedRepos = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const nodes = await createGitHubClient(await getGithubToken()).getPinnedRepos();
    return {
      data: {
        viewer: {
          pinnedItems: { nodes },
          repositories: { nodes: [] },
        },
      },
    } satisfies PinnedViewerReposResponse;
  } catch {
    return null;
  }
});
```

There's no preload channel and no IPC: the client calls `getPinnedRepos()` and TanStack Start handles the RPC over the local HTTP server that the webview is already talking to.

## Pairing TanStack Start with Elysia (for SSE)

Server functions work well for request/response calls. A RAG indexer, though, needs **long-lived streams**: "fetched repo X", "embedded chunk 40/200", "upserted into the vector index". Those should be pushed to the UI as they happen, not polled.

TanStack Start server routes can return a raw `Response`, so you _can_ stream SSE by hand. But then you build the `ReadableStream`, encode `data:` frames, set `text/event-stream` / `no-cache` / `X-Accel-Buffering` headers, and wire up abort handling yourself. [`src/lib/sse.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/lib/sse.ts) shows what that looks like. Doing it per endpoint gets old fast.

So this project mounts [Elysia](https://elysiajs.com/) **inside** TanStack Start, following the official [TanStack Start integration](https://elysiajs.com/integrations/tanstack-start). Elysia gives us:

- **SSE as async generators**: `yield sse({ data })` inside `async function*`, with `request.signal` for disconnects ([Elysia SSE docs](https://elysiajs.com/essential/handler#server-sent-events-sse)).
- **Validation**: TypeBox `t.Object(...)` schemas on body/query/params.
- **End-to-end types**: [Eden Treaty](https://elysiajs.com/eden/treaty/overview) gives a typed client (tRPC-style) derived from the route tree.
- **One composable API tree**: feature routes (`/system`, `/models`, `/enrich`, `/worker`, `/chat`, …) are separate `Elysia` instances combined with `.use()`.

It all runs in the same Nitro process as the UI, on the same port, and inside the same `deno desktop` binary. There's no second server to start.

### 1. Mount Elysia as a catch-all server route

[`src/routes/api/elysia/$.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/routes/api/elysia/$.ts) forwards every method under `/api/elysia/*` to Elysia's `fetch`:

```ts
import { elysiaApp } from "@/elysia/app";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Mount Elysia under `/api/elysia/*` inside TanStack Start.
 * @see https://elysiajs.com/integrations/tanstack-start
 */
const handle = ({ request }: { request: Request }) => elysiaApp.fetch(request);

export const Route = createFileRoute("/api/elysia/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
```

With pnpm, add Elysia's peer deps explicitly (`pnpm add @sinclair/typebox openapi-types`). pnpm does not auto-install them.

### 2. Compose the app

[`src/elysia/app.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/elysia/app.ts) owns the prefix and composes the feature routes. The `/tick` route is the smallest possible SSE stream: one event per second until the client disconnects.

```ts
import { sleep } from "@/lib/sse";
import { Elysia, sse } from "elysia";

export const elysiaApp = new Elysia({ prefix: "/api/elysia" })
  .get("/tick", async function* ({ request }) {
    let n = 0;
    while (!request.signal.aborted) {
      n += 1;
      yield sse({
        event: "tick",
        data: { n, at: new Date().toISOString() },
      });
      try {
        await sleep(1000, request.signal);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") break;
        throw caught;
      }
    }
  })
  .use(consoleRoute)
  .use(systemRoute)
  .use(embeddingsRoute)
  .use(workerRoute)
  .use(enrichRoute)
  .use(helloRoute)
  .use(chatRoute);

export type ElysiaApp = typeof elysiaApp;
```

### 3. A publish/subscribe example: `/hello`

[`src/elysia/routes/hello/index.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/elysia/routes/hello/index.ts) is the toy version of the live activity bus from [chapter 4](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/04-live-activity-bus.md). `POST /hello` publishes a message, and every open `GET /hello/sse` connection receives it:

```ts
import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import { Elysia, sse, t } from "elysia";

export const helloRoute = new Elysia({ prefix: "/hello" })
  .get("/", () => [{ id: "1", message: "Hello, world!" }])
  .get("/sse", async function* ({ request }) {
    // `{ signal }` ends the loop (and removes listeners) when the client disconnects.
    for await (const message of pubSub.listen<string>(PUB_SUB_TOPICS.HELLO_MESSAGE, {
      signal: request.signal,
    })) {
      yield sse({ data: message });
    }
  })
  .post(
    "/",
    ({ body }) => {
      pubSub.publish(PUB_SUB_TOPICS.HELLO_MESSAGE, body.message);
      return { message: `Emitted ${body.message}` };
    },
    { body: t.Object({ message: t.String() }) },
  );
```

The bus in [`src/lib/pub-sub/client.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/lib/pub-sub/client.ts) is a process-wide `EventEmitter`. It's pinned on `globalThis` so Vite HMR re-evaluating the module doesn't give routes and workers two different emitters:

```ts
export const pubSub: PubSub = (() => {
  const g = globalThis as GlobalWithPubSub;
  g[GLOBAL_KEY] ??= new PubSub();
  return g[GLOBAL_KEY];
})();
```

### 4. A typed Eden client on both sides

[`src/elysia/treaty.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/elysia/treaty.ts) uses TanStack Start's `createIsomorphicFn`. On the server (SSR, loaders, server functions) Eden calls the Elysia app **in-process with no HTTP**. In the browser it makes HTTP calls to the same origin:

```ts
export const getElysiaTreaty = createIsomorphicFn()
  .server(() => getServerElysiaTreaty())
  .client(() => {
    const origin = globalThis.location?.origin ?? clientEnv.VITE_APP_URL;
    return (treaty(origin) as unknown as ElysiaTreatyRoot).api.elysia;
  });
```

Two project-specific tweaks on top of the Elysia docs:

- **The server half lives in [`treaty.server.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/elysia/treaty.server.ts)**, so the client bundle never imports `app.ts` (and with it every route, worker, and Node-only module). This also avoids a circular import with the route tree.
- **Types come from `ElysiaApp["~Routes"]`**, not `treaty<typeof app>()`. Deno and Vite can resolve two copies of the `elysia` types, and `typeof app` then fails to line up. Pulling out the route map sidesteps that.

### 5. Call it from React

A plain mutation, fully typed from the route's TypeBox schema ([`PingMessage.tsx`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/routes/_dashboard/$user/hello/-components/PingMessage.tsx)):

```tsx
const { mutate, isPending } = useMutation({
  mutationFn: async (input: { message: string }) => {
    const { data, error } = await getElysiaTreaty().hello.post({
      message: input.message,
    });
    if (error) throw new Error(treatyErrorMessage(error));
    return data;
  },
});
```

And the SSE side ([`src/hooks/use-hello-sse.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/hooks/use-hello-sse.ts)). Eden's `~path` gives us the URL without hardcoding it, and a native `EventSource` handles reconnects:

```ts
const connect = () => {
  const path = getElysiaTreaty().hello.sse["~path"];
  source = new EventSource(path);
  source.onmessage = (event) => appendHelloMessage(event.data);
  source.onerror = () => {
    if (source && source.readyState !== EventSource.CONNECTING) {
      source.close();
    }
  };
};
```

`appendHelloMessage` writes into a TanStack DB collection ([`hello-collection.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/data-access-layer/enriched/hello-collection.ts)). The collection is seeded from `GET /hello`, and live SSE rows are appended on top. Chapters 3–4 use the same pattern for embedding progress.

## Product objectives

This is the product the rest of the series builds toward:

- **Natural-language search over starred repos.** Ask "that Rust crate for terminal UIs with a flexbox layout" and get the right starred repo back, even if you starred it three years ago and forgot the name.
- **Local RAG pipeline**: fetch → embed → store → retrieve.
  - **Fetch**: README and metadata for each starred repo via the user's GitHub token, paced under API rate limits.
  - **Embed**: [EmbeddingGemma](https://ai.google.dev/gemma/docs/embeddinggemma) via ONNX Runtime (`onnxruntime-node`), on-device.
  - **Store**: vectors in PGlite with [pgvector](https://github.com/pgvector/pgvector), ranked by cosine distance ([`src/pglite/client.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/pglite/client.ts)).
  - **Retrieve**: vector similarity search, with the matching repos shown in the UI.
- **Stay on-device.** Your stars, READMEs, and vectors never leave the machine. There's no hosted RAG SaaS or vector DB in the loop. The only network calls are to GitHub (the source of truth) and to `apps/api` for sign-in.
- **Visible progress.** Indexing takes minutes on purpose, so the UI shows live activity over SSE instead of a spinner.

## Non-goals for v1

- **Multi-user cloud.** One user and one machine. The API exists only for OAuth and never stores the corpus.
- **Realtime collaboration or sync** across devices.
- **Horizontal scale.** One embedded server process, so an in-memory pub/sub is enough (see chapter 4 for when it isn't).
- **Indexing all of GitHub.** Only the user's own stars and repos.
- **Custom model training or fine-tuning.** We use an off-the-shelf embedding model as-is.

## How later chapters fit

1. **[Chapter 2: Better Auth](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/02-better-auth.md)**: sign in with GitHub through the system browser, PKCE, and a loopback server in the preload, so the app gets a user token without shipping secrets.
2. **[Chapter 3: Worker engine](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/03-worker-engine.md)**: a durable job queue that crawls stars, stays under rate limits, and embeds repos in batches.
3. **[Chapter 4: Live activity bus](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/04-live-activity-bus.md)**: the `/hello` pub/sub pattern above, reused as typed progress events from the worker to the UI.
4. **[Chapter 5: Query path](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/05-query-path.md)**: embed the question, run a pgvector search, and render results.
