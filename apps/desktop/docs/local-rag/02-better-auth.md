# Chapter 2: Better Auth

[Series index](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/README.md) · Prev: [Chapter 1](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/01-deno-desktop-setup.md) · Next: [Chapter 3: Worker engine](https://github.com/tigawanna/tangerine/blob/main/apps/desktop/docs/local-rag/03-worker-engine.md)

## Goal

Sign the desktop app into GitHub so we can read starred repos (and stay inside API quotas with a real user token).

## Why Better Auth

[Better Auth](https://better-auth.com/) is one of the nicest things in TypeScript right now: framework-agnostic, plugin-based, and it owns the boring parts (OAuth state, sessions, account linking, CSRF). So whenever I try a new framework, the first thing I check is whether someone already has a Better Auth integration for it.

For desktop apps there are two places to look: the official Electron integration and the community Tauri plugins. Neither drops into Deno Desktop as-is, but both taught us what the moving parts are.

## What already exists

### Electron (official)

Better Auth ships [`@better-auth/electron`](https://better-auth.com/docs/integrations/electron). It has three pieces:

| Piece                              | Runs in                         | Job                                                                                   |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `electron()` server plugin         | your Better Auth server         | PKCE-checked `/electron/token` exchange, `transferUser`, redirect cookie              |
| `electronProxyClient()`            | your **web** sign-in page       | preserves PKCE through `signIn.social`, then redirects to `com.example.app:/auth/callback?token=…` |
| `electronClient()` + `setupMain()` | Electron **main** process       | generates PKCE, opens the system browser, handles the deep link, stores cookies       |

The client half is built around Electron's [process model](https://www.electronjs.org/docs/latest/tutorial/process-model). There's a Node **main** process that owns windows and OS integration, sandboxed Chromium **renderer** processes (one per window), and **preload** scripts that bridge them with `contextBridge` + `ipcRenderer`. `setupMain()` registers the protocol handler for deep links, a `user-image://` protocol, CSP, and `ipcMain` handlers. `setupRenderer()` then exposes `window.requestAuth()`, `window.onAuthenticated()` and friends through the preload. Tokens never reach the renderer.

Deno Desktop has none of that plumbing ([comparison](https://docs.deno.com/runtime/desktop/comparison/)):

- **No `electron` module**, so no `ipcMain`, `contextBridge`, `protocol`, or `app.on("open-url")`.
- **No separate main process.** The Deno runtime and the webview live in one process (CEF) or one coordinated process group (OS webview). They talk through [bindings](https://docs.deno.com/runtime/desktop/bindings/) (`win.bind` / `bindings.x()`), which are in-process channels, not IPC.
- **Deep links are registered but not delivered.** `desktop.app.deepLinks` registers `com.tigawanna.tangerine` at package time, but Deno does not hand `open-url` to JS yet (see [Asking upstream](#asking-upstream) below). The custom-scheme return that the Electron flow depends on never arrives.

The good news: the **server plugin and the web proxy client are plain HTTP**. They don't care what the desktop shell is. Only the Electron client half is Electron-specific, so that's the only part we rewrite.

### Tauri (community)

There's no official Tauri package ([issue #8409](https://github.com/better-auth/better-auth/issues/8409) was closed as "no official plan yet"), but two community plugins solve the same problem in different ways.

**[`daveyplate/better-auth-tauri`](https://github.com/daveyplate/better-auth-tauri)** replays the OAuth callback inside the app. A server hook rewrites `callbackURL` onto the app's scheme. When the OS delivers the deep link (`@tauri-apps/plugin-deep-link`), the client strips the scheme and re-issues the same `/api/auth/...` request through `authClient.$fetch`, so the callback lands in the **app's** cookie jar instead of the browser's:

```ts
// src/client/handle-auth-deep-link.ts (trimmed)
const href = `/${url.replace(`${scheme}:/${basePath}`, "")}`;
const response = await authClient.$fetch(href);
if (response.error?.status !== 302 && response.error?.message) onError?.(response.error);
else onSuccess?.(new URL(url).searchParams.get("callbackURL"));
```

Sign-in calls `signIn.social({ disableRedirect: true })` and opens the returned URL with `@tauri-apps/plugin-opener`, so the webview never navigates to GitHub. On macOS/Windows it swaps `fetch` for `@tauri-apps/plugin-http` so cookies stick.

**[`DreamsHive/better-auth-tauri`](https://github.com/DreamsHive/better-auth-tauri)** copies the official Expo plugin. The server appends the session cookie to the scheme redirect (`yourapp://?cookie=…`), and the client stores it and sends it back on every request. Webviews can't set `Cookie` (it's a [forbidden header](https://fetch.spec.whatwg.org/#forbidden-header-name)), so the client uses an `x-tauri-cookie` header and the server plugin rewrites it back to `Cookie`:

```ts
export const auth = betterAuth({
  trustedOrigins: ["yourapp://"],
  plugins: [tauri()], // tauri-origin → origin, x-tauri-cookie → Cookie, ?cookie= on scheme redirects
});
```

It also leaves storage to you, and its README recommends the OS keychain over `localStorage`.

### Asking upstream

Before building anything, I asked on the Deno repo how Better Auth OAuth should work in Deno Desktop: [Deno desktop better auth (discussion #36796)](https://github.com/denoland/deno/discussions/36796). The accepted answer, from [@ryux1](https://github.com/ryux1), settled most of the design:

> However, current Deno `main` only writes the OS registration metadata. The implementation explicitly says that delivering the opened URL to the running app, single-instance forwarding, and the JavaScript `open-url` event are tracked separately […]
>
> For now I would keep Better Auth on a normal web backend and use a system-browser authorization flow with PKCE and state. The return path needs to be either: a loopback listener bound to 127.0.0.1 on a temporary port; or a manual short-lived authorization-code handoff similar to Better Auth's documented Electron fallback.

What that meant for us:

- **The Electron client can't be reused, but the server side can.** The Electron package's client pieces depend on Electron APIs. The Better Auth server, the `electron()` plugin, and the web proxy flow are plain HTTP, so only the desktop half needs writing: browser launch, PKCE state, code exchange, and token storage.
- **Registering the scheme doesn't make deep links work.** The source the answer points to ([`cli/tools/desktop.rs`](https://github.com/denoland/deno/blob/336da420f4343cbb1dcbd5eed9d075ff555ed6ee/cli/tools/desktop.rs#L713-L721)) confirms the app never receives the URL. A custom-scheme OAuth callback can't complete today.
- **Two return paths:** a `127.0.0.1` loopback, plus a paste-the-code fallback modelled on Better Auth's [Electron manual token exchange](https://better-auth.com/docs/integrations/electron#manual-token-exchange).
- **The GitHub client secret stays on the API.** Nothing secret ships in the binary.
- **The loopback is temporary.** Once Deno delivers `open-url` both at launch and to an already-running app, the custom scheme can replace it.

We ended up building both return paths: the loopback is the main one, and the paste box is the fallback.

### What we took from all of this

1. **OAuth belongs in the system browser.** Real address bar, existing GitHub session, and providers that block embedded webviews still work.
2. **The return path is the hard part.** Electron and Tauri both use a custom-scheme deep link, which Deno can't deliver yet. Per the discussion, use a `127.0.0.1` loopback plus a paste-the-code fallback.
3. **Keep the session out of the webview.** Electron keeps it in main, and Tauri fights the webview's cookie rules. With Deno we can keep it in the Deno runtime and only expose `bindings.getSession()`.
4. **Storage is your problem.** Electron uses `conf` in `userData`, and Tauri asks for a keychain adapter. Deno Desktop has no native secure-storage API yet, so we use a JSON file under the config dir.
5. **Reuse the official server plugin.** `electron()` already implements the PKCE exchange, so we don't reinvent it.
6. **Secrets stay on the server.** The GitHub client secret lives only on `apps/api`. The desktop binary only ever sees a PKCE verifier and, after the exchange, a session token.

## Our flow

Same shape as Electron: `electron()` on the API, `electronProxyClient()` on the web page, and our own client in the Deno preload. The deep link is swapped for a **loopback HTTP server** on `127.0.0.1`.

```text
 +-------------+   bindings.requestAuth()   +----------------+
 | Desktop UI  | -------------------------> | Deno preload   |
 | (webview)   |                            | PKCE + loopback|
 +-------------+                            +----------------+
        ^                                          |
        |                                          | open system browser
        |                                          v
        |                                 +-------------------+     GitHub OAuth     +-----------+
        |                                 | apps/web  /auth   | <------------------> | apps/api  |
        |                                 | (system browser)  |                      | electron()|
        |                                 +-------------------+                      +-----------+
        |                                          |                                       ^
        |                                          | fetch 127.0.0.1:17832/callback?token= |
        |                                          v                                       |
        |   tangerine:authenticated        +----------------+   POST /electron/token       |
        +--------------------------------- | Deno preload   | -----------------------------+
            + navigate("/viewer")          | save session   |   { token, state, verifier }
                                           +----------------+
```

Three apps take part: `apps/api` (`:5000`) owns Better Auth and the GitHub secret, `apps/web` (`:3064`) hosts the sign-in page the system browser opens, and `apps/desktop` (`:3070`) is the native shell. No GitHub secret ever ships in the desktop binary.

## Step by step

### 1. Server: `electron()` + `bearer()` on the API

[`apps/api/src/lib/auth.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/api/src/lib/auth.ts) is the only Better Auth instance. The desktop-relevant bits are the two plugins and the trusted origin:

```ts
betterAuth({
  baseURL: envVariables.BETTER_AUTH_URL, // public web origin, not the API host
  basePath: "/api/auth",
  trustedOrigins: [...AUTHORIZED_ORIGINS, ELECTRON_TRUSTED_ORIGIN], // "com.tigawanna.tangerine:/"
  socialProviders: {
    github: {
      clientId: envVariables.GITHUB_CLIENT_ID,
      clientSecret: envVariables.GITHUB_CLIENT_SECRET,
      scope: [...DEFAULT_GITHUB_SCOPES],
      mapProfileToUser: (profile: GithubProfile) => ({ githubUsername: profile.login /* … */ }),
    },
  },
  plugins: [electron(), bearer() /* openAPI, apiKey, admin … */],
});
```

- `electron()` gives us `/electron/token` (PKCE exchange) and `transferUser` for free.
- `bearer()` lets the preload authenticate with `Authorization: Bearer <token>` instead of rebuilding a signed cookie jar (see lesson 4 below).
- `ELECTRON_TRUSTED_ORIGIN` comes from [`packages/auth/src/electron.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/packages/auth/src/electron.ts), so the API, web, and desktop all agree on the scheme.

### 2. UI: ask the preload to start

The desktop sign-in button ([`src/routes/auth/-components/GitHubSignIn.tsx`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/routes/auth/-components/GitHubSignIn.tsx)) doesn't touch OAuth. It calls a binding and waits:

```ts
const desktopSignIn = useMutation({
  mutationFn: async () => {
    if (!globalThis.bindings) throw new Error("Desktop bindings unavailable");
    setAwaitingBrowser(true);
    await globalThis.bindings.requestAuth();
  },
});
```

### 3. Preload: PKCE, loopback, open the browser

[`deno/auth/request-auth.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/auth/request-auth.ts) does what `electronClient().requestAuth()` would do in Electron main:

```ts
export async function requestAuth() {
  const cfg = readConfig();
  const state = randomString(16);
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = await generateCodeChallenge(codeVerifier); // SHA-256, base64url
  await rememberPkce(state, codeVerifier); // memory + ~/.config/tangerine-desktop/pkce.json

  const loopback = await startLoopbackServer(); // http://127.0.0.1:<real port>/callback

  const url = new URL(cfg.signInURL); // apps/web /auth
  url.searchParams.set("client_id", CLIENT_ID); // "electron"
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("loopback", loopback);

  await openExternal(url.toString()); // xdg-open / open / start
  return { loopback, state };
}
```

The query params are exactly what `electronProxyClient` expects. `loopback` is our one addition.

### 4. Preload: the loopback server

[`deno/auth/loopback.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/auth/loopback.ts) is a tiny `Deno.serve` on `127.0.0.1` that stands in for the deep link. It starts at app boot (from `deno/window.ts`), not on click, so the port is ready before the browser needs it:

```ts
const server = Deno.serve(
  {
    hostname: "127.0.0.1",
    port: preferredPort, // DESKTOP_AUTH_LOOPBACK_PORT or 17832
    onListen: (addr) => {
      boundPort = addr.port; // Deno Desktop may remap — always advertise this one
    },
  },
  async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/health") return Response.json({ ok: true }, { headers: corsHeaders });
    if (url.pathname !== "/callback") return new Response("Not found", { status: 404 });

    const token = url.searchParams.get("token");
    if (!token) return Response.json({ ok: false, error: "missing_token" }, { status: 400 });
    await authenticate({ token }); // step 6
    return Response.json({ ok: true }, { headers: corsHeaders });
  },
);
```

The handle lives on `globalThis` under a `Symbol.for(...)` key and gets probed via `/health` before reuse, so HMR or a second `requestAuth()` doesn't orphan a dead listener.

The discussion suggested a temporary port. We start with a fixed preferred port instead, because random ports kept breaking after HMR and re-sign-in: the browser tab still held the old URL. Deno Desktop can remap it anyway, so the advertised URL always uses the real port from `onListen`.

This whole step is the part that goes away once Deno delivers `open-url`. At that point the web page can redirect to `com.tigawanna.tangerine:/auth/callback?token=…` like the stock Electron flow, and the preload handles it with the same `authenticate()` call.

### 5. Web: sign in, then hand the code to the loopback

The browser half ([`apps/web/src/routes/auth/-components/GitHubSignIn.tsx`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/web/src/routes/auth/-components/GitHubSignIn.tsx)) uses the official proxy client ([`apps/web/src/lib/auth-client.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/web/src/lib/auth-client.ts)):

```ts
export const authClient = createAuthClient({
  baseURL: clientEnv.VITE_APP_URL,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  plugins: [electronProxyClient({ protocol: { scheme: ELECTRON_PROTOCOL_SCHEME } })],
});
```

On click it forwards the PKCE params into `signIn.social` and sets the callback back to `/auth`, so the page can finish the handoff after GitHub returns:

```ts
await authClient.signIn.social({
  provider: "github",
  callbackURL: `${window.location.origin}/auth${window.location.search}`,
  scopes: buildGithubOAuthScopes([...selected]),
  fetchOptions: { query: electronQuery }, // client_id, state, code_challenge
});
```

Back on `/auth`, instead of `ensureElectronRedirect()` (which would redirect to the custom scheme), it asks the API for an authorization code and **fetches** the loopback with it:

```ts
const transferred = await authClient.electron.transferUser({
  fetchOptions: { query: electronQuery },
});
const identifier = transferred.data?.electron_authorization_code;
// token = base64url(JSON.stringify({ identifier, state }))
const target = new URL(loopback);
target.searchParams.set("token", encodeRedirectToken(identifier, electronQuery.state));
const res = await fetch(target, { headers: { accept: "application/json" } });
if (res.ok) window.location.replace("/auth/desktop-done"); // "you can close this tab"
```

It uses `fetch` rather than navigating to the loopback URL, so if the listener is down the page stays put and shows the token for the paste fallback.

### 6. Preload: exchange the code for a session

[`deno/auth/authenticate.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/auth/authenticate.ts) decodes the token, finds the matching PKCE verifier by `state`, and calls the `electron()` plugin's exchange endpoint:

```ts
const { identifier, state } = decodeRedirectToken(input.token);
const codeVerifier = await peekPkce(state); // read, don't consume yet

const res = await fetch(`${authBase(cfg)}/electron/token`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ token: identifier, state, code_verifier: codeVerifier }),
});
if (!res.ok) throw new Error(await res.text());

await clearPkce(state); // only after success, so retries still work
const data = (await res.json()) as { token: string; user: DesktopAuthUser };
await saveStored({ cookies, user: data.user, token: data.token }); // session.json
getAuthListeners().onAuthenticated?.(data.user);
```

The same function backs the paste fallback: `bindings.authenticate({ token })` from the UI ends up here too.

### 7. Session storage and authenticated calls

The session is a JSON file in the Deno runtime, never in the webview:

```text
~/.config/tangerine-desktop/
├── session.json   # { user, token, cookies }, written after a good exchange
└── pkce.json      # in-flight state → verifier (last 20), survives restarts/HMR
```

Every call from the preload to the API goes through one helper ([`deno/auth/cookies.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/auth/cookies.ts)):

```ts
export function apiHeaders(stored: StoredSession, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("origin", `${PROTOCOL_SCHEME}:/`); // Better Auth CSRF check
  const cookie = cookieHeader(stored.cookies);
  if (cookie) headers.set("cookie", cookie);
  if (stored.token) headers.set("authorization", `Bearer ${stored.token}`);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return headers;
}
```

Deno's `fetch` runs outside the webview, so it can set `Cookie` and `Origin` freely. That's the problem DreamsHive works around with `x-tauri-cookie`, and here it simply doesn't exist.

Plain JSON is a tradeoff: Deno Desktop doesn't have a secure-storage API yet. When it lands, `session-store.ts` is the only file that needs to change.

### 8. Tell the UI, and guard routes with bindings

After `onAuthenticated`, the preload ([`deno/window.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/window.ts)) pushes an event into the webview **and** navigates, because `executeJs` events can get dropped:

```ts
setAuthListeners({
  onAuthenticated: (user) => {
    notifyRenderer("tangerine:authenticated", user); // window CustomEvent
    win.navigate(`${appOrigin()}/viewer`);
  },
  onAuthError: (message) => notifyRenderer("tangerine:auth-error", { message }),
});
```

Route guards ask the preload, not cookies ([`src/routes/_dashboard/layout.tsx`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/routes/_dashboard/layout.tsx)). The same code still works in a plain browser tab via the normal Better Auth session:

```ts
if (hasDesktopBindings() && globalThis.bindings) {
  const desktopSession = await globalThis.bindings.getSession();
  if (!desktopSession) throw redirect({ to: "/auth", search: { returnTo: location.pathname } });
  sessionUser = desktopSession.user;
} else {
  const session = await getSession();
  if (!session) throw redirect({ to: "/auth", search: { returnTo: location.pathname } });
  sessionUser = session.user;
}
```

### 9. The payoff: a GitHub token for the RAG corpus

The whole point is a real user token for GitHub. It lets us list starred repos and pull READMEs and metadata at the authenticated rate limit instead of the anonymous one. [`deno/auth/session.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/deno/auth/session.ts) exposes it as `bindings.getGithubAccessToken()`:

```ts
// Better Auth wants the account *row* id, not GitHub's user id
const accountId = await resolveGithubAccountRowId(stored); // GET /list-accounts → providerId === "github"
const res = await fetch(`${authBase(cfg)}/get-access-token`, {
  method: "POST",
  headers: apiHeaders(stored),
  body: JSON.stringify({ accountId }),
});
```

Better Auth keeps the GitHub OAuth token on the API side, and the desktop fetches it on demand. Chapter 3's worker uses it to crawl stars.

## Lessons learned

Most of these cost an evening each. The full list with debugging tips is in [`docs/auth.md`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/docs/auth.md#gotchas-learned-the-hard-way).

1. **Deno Desktop can remap your loopback port.** Ask for `17832`, but always advertise the port from `onListen`. Start the loopback at boot and keep a strong reference to the server, or the browser ends up posting to a dead port.

   ```ts
   // ✗ advertises the port you asked for
   Deno.serve({ port: 17832 }, handler);
   loopback = "http://127.0.0.1:17832/callback";

   // ✓ advertises the port you actually got
   Deno.serve({ port: 17832, onListen: ({ port }) => (boundPort = port) }, handler);
   loopback = `http://127.0.0.1:${boundPort}/callback`;
   ```

2. **Use a query string, not a fragment.** `#token=` never reaches an HTTP server. Use `?token=`.
3. **Persist PKCE and peek, don't pop.** HMR and React Strict Mode remounts will lose an in-memory verifier. Keep it on disk and clear it only after a successful exchange. If it's gone but `session.json` is valid, treat that as already signed in.

   ```ts
   const verifier = await peekPkce(state); // read only; a retry can reuse it
   if (!verifier) return (await getSession()) ?? fail("start sign-in again");

   const res = await exchange(identifier, state, verifier);
   if (res.ok) await clearPkce(state); // consume only after success
   ```

4. **The raw session token is not the cookie.** `/electron/token` returns the DB session token, while the `better-auth.session_token` cookie is signed. Putting the raw token in `Cookie` makes `get-session` come back empty. Use `Authorization: Bearer` (hence `bearer()` on the API).
5. **Send `Origin` on every cookie-bearing request.** Better Auth's CSRF check rejects requests with a missing or `null` Origin (`MISSING_OR_NULL_ORIGIN`). Electron sets it for you. In Deno, send `com.tigawanna.tangerine:/` yourself.

   ```ts
   // ✗ empty session, then 403 on the first POST
   headers.set("cookie", `better-auth.session_token=${rawToken}`);

   // ✓ what apiHeaders() sends
   headers.set("authorization", `Bearer ${rawToken}`);
   headers.set("origin", "com.tigawanna.tangerine:/");
   ```

6. **Don't wipe the session on soft failures.** Only clear `session.json` when the API says the session is gone (`user: null`) or on sign-out. Never do it on a network error or a bad cookie.
7. **Guard with bindings, not cookies.** Server functions reading Start request cookies always look logged-out inside the native shell. The session lives in the preload.
8. **Tell the UI more than once.** `executeJs` CustomEvents can be dropped. We send the event, call `win.navigate("/viewer")`, and poll `bindings.getSession()` while the UI shows "Waiting for browser…".
9. **Gate the web handoff on the click.** Don't poll `transferUser` while the user is still picking scopes. If a web session already exists, run only the handoff and not `signIn.social` as well, or GitHub bounces you back to `/auth` looking stuck.
10. **`/get-access-token` wants `{ accountId }`, the account row id** from `list-accounts`, not GitHub's numeric id.
11. **Keep the env split straight.**
    - Desktop `VITE_API_URL` points at the API (`:5000`) for the token exchange.
    - `VITE_APP_URL` is the desktop UI (`:3070`).
    - `VITE_SIGN_IN_URL` is the web `/auth` page (`:3064`).
    - On the API, `BETTER_AUTH_URL` is the **web** origin, so OAuth cookies stay first-party.
12. **The preload does not hot-reload.** Changes to `deno/*` and `.env` only apply after you fully quit and restart the app. Vite HMR only refreshes the UI.

## Wishlist for Deno Desktop

Most of the code in `deno/auth/` works around something the runtime doesn't do yet. These are the features that would shrink it, roughly in order of impact:

1. **Deliver `open-url` to JS.** A `Deno.BrowserWindow` or app-level `open-url` event that fires both when the scheme launches the app and when it's already running. This alone would delete the loopback server (`loopback.ts`, about 200 lines), the port-remap handling, and the web-side `fetch` handoff. The web page could just use the stock `ensureElectronRedirect()`.

   ```ts
   // hypothetical API: replaces loopback.ts
   Deno.desktop.addEventListener("open-url", async ({ url }) => {
     const token = new URL(url).searchParams.get("token");
     if (token) await authenticate({ token });
   });
   ```

2. **Single-instance lock with argument forwarding.** Opening `com.tigawanna.tangerine:/…` while the app runs should focus the existing window and pass the URL along, not start a second copy. Electron has `requestSingleInstanceLock()` and Tauri has `tauri-plugin-single-instance`. Deep links are only half useful without it.
3. **A native auth-session API.** Something like macOS's [`ASWebAuthenticationSession`](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) or Windows' [`WebAuthenticationBroker`](https://learn.microsoft.com/en-us/uwp/api/windows.security.authentication.web.webauthenticationbroker): `await Deno.desktop.authenticate({ url, callbackScheme })` opens the system browser and resolves with the callback URL. That would replace deep links, the loopback, and the paste fallback in one call.

   ```ts
   // hypothetical API: the whole return path in one await
   const callback = await Deno.desktop.authenticate({
     url: signInUrlWithPkce,
     callbackScheme: "com.tigawanna.tangerine",
   });
   await authenticate({ token: new URL(callback).searchParams.get("token")! });
   ```

4. **Secure storage.** Keychain / Credential Manager / Secret Service behind one API. The session is plain JSON in `~/.config/tangerine-desktop/session.json` today because there's nothing else; Deno lists this under ["doesn't have yet"](https://docs.deno.com/runtime/desktop/comparison/#what-deno-desktop-doesnt-have-yet).
5. **Open a URL in the default browser.** A built-in `openExternal(url)`. We shell out to `xdg-open` / `open` / `cmd /c start` in `open-external.ts`, which is fiddly on Windows and needs `--allow-run`.
6. **Reliable Deno → webview events.** Bindings only go from the webview to Deno. To push "signed in" back, we `executeJs` a `CustomEvent`, which can get dropped, so we also navigate and poll `bindings.getSession()`. A typed `win.emit(channel, payload)` paired with a webview-side `bindings.on(channel, fn)` would remove all three workarounds.

   ```ts
   // today: string-built JS that may never arrive
   win.executeJs(`window.dispatchEvent(new CustomEvent("tangerine:authenticated", …))`);

   // hypothetical: typed push from Deno, subscription in the webview
   win.emit("auth:changed", user);
   bindings.on("auth:changed", (user) => navigate({ to: "/viewer" }));
   ```

7. **Hot reload for the preload.** `--preload` and `--env-file` are read once at startup, so every auth change means fully quitting the app. HMR for `deno/*` (or at least a "reload preload" command) would make iterating on this flow far less painful.
8. **Predictable `Deno.serve` ports.** A way to opt out of port remapping when an explicit port is requested, or a documented rule for when it happens. Half of lesson 1 exists because the port you ask for isn't always the port you get.
9. **Typed bindings.** A shared type between `win.bind(...)` and `bindings.*`. Today we keep [`src/lib/desktop-bindings.ts`](https://github.com/tigawanna/tangerine/blob/cac981aca4b365f2ee1293fbf5248da5548c3b5a/apps/desktop/src/lib/desktop-bindings.ts) in sync with `deno/window.ts` by hand, and the [docs](https://docs.deno.com/runtime/desktop/bindings/#type-safety) suggest the same.
