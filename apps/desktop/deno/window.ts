/**
 * Preload for `deno desktop --preload`.
 * Adopts the startup window and exposes auth / navigate bindings to the webview.
 *
 * Auth lives in the Deno runtime (like Electron main): PKCE, system browser,
 * loopback callback, session cookie jar. The webview is UI-only.
 */
/// <reference lib="deno.ns" />
/// <reference lib="deno.desktop" />

import {
  authenticate,
  getGithubAccessToken,
  getSession,
  openExternal,
  requestAuth,
  setAuthListeners,
  startLoopbackServer,
  signOut,
  type DesktopAuthUser,
} from "./auth.ts";

const win = new Deno.BrowserWindow({
  title: "Tangerine",
  width: 1280,
  height: 840,
});

function notifyRenderer(channel: string, payload: unknown): void {
  // Best-effort: push events into the webview via a custom DOM event.
  const json = JSON.stringify(payload ?? null);
  void win.executeJs(
    `window.dispatchEvent(new CustomEvent(${JSON.stringify(channel)}, { detail: ${json} }));`,
  );
}

function appOrigin(): string {
  return (Deno.env.get("VITE_APP_URL") ?? "http://localhost:3070").replace(/\/$/, "");
}

setAuthListeners({
  onAuthenticated: (user) => {
    notifyRenderer("tangerine:authenticated", user);
    // CEF may drop executeJs CustomEvents — hard-navigate off /auth.
    win.navigate(`${appOrigin()}/viewer`);
  },
  onAuthError: (message) => {
    notifyRenderer("tangerine:auth-error", { message });
  },
});

// Bind OAuth loopback at startup so Sign-in does not race a dead/random port.
void startLoopbackServer().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[tangerine-desktop] loopback failed to start:", message);
});

win.bind("navigate", async (url: string) => {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("navigate(url) requires a non-empty string");
  }
  win.navigate(url);
});

win.bind("openExternal", async (url: string) => {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("openExternal(url) requires a non-empty string");
  }
  await openExternal(url);
});

win.bind("requestAuth", async (options?: { provider?: string }) => {
  return await requestAuth(options);
});

win.bind("authenticate", async (input: { token: string }) => {
  return await authenticate(input);
});

win.bind("getSession", async () => {
  return await getSession();
});

win.bind("signOut", async () => {
  await signOut();
});

win.bind("getGithubAccessToken", async () => {
  return await getGithubAccessToken();
});

if (Deno.env.get("DENO_DESKTOP_DEVTOOLS") === "1") {
  win.openDevtools();
}

// Warm session so the renderer can listen for updates after load.
void getSession().then((session) => {
  if (session?.user) {
    notifyRenderer("tangerine:authenticated", session.user as DesktopAuthUser);
  }
});
