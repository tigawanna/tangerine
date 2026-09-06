/**
 * Single-window bootstrap for `deno desktop`.
 *
 * Passed as `--preload` so TanStack Start framework detection still runs
 * (`deno desktop --hmr .`). The first `BrowserWindow` adopts the implicit
 * startup window — do not construct a second one unless you want multi-window.
 *
 * `bindings.navigate(url)` keeps OAuth (and other off-origin redirects) inside
 * this window. Assigning `window.location` to github.com on Linux WebView/CEF
 * often opens the system browser, which loses the Better Auth state cookie.
 *
 * @see https://docs.deno.com/runtime/desktop/windows/
 * @see https://docs.deno.com/runtime/desktop/bindings/
 * @see https://docs.deno.com/runtime/desktop/hmr/
 */
// @ts-nocheck — Deno.BrowserWindow is provided by the desktop runtime (Deno ≥ 2.9).

const APP_TITLE = "Tangerine";
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 840;

const win = new Deno.BrowserWindow({
  title: APP_TITLE,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  resizable: true,
});

win.focus();

/** Keep navigations (esp. GitHub OAuth) inside this webview's cookie jar. */
win.bind("navigate", (url: unknown) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    throw new Error("navigate: expected http(s) URL string");
  }
  win.navigate(url);
});

if (Deno.env.get("DENO_DESKTOP_DEVTOOLS") === "1") {
  win.openDevtools();
}

console.info(
  `[desktop] window ${win.windowId} ready (${DEFAULT_WIDTH}×${DEFAULT_HEIGHT})`,
);
