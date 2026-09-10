/**
 * Preload for `deno desktop --preload`. Runs before the synthetic TanStack Start
 * entrypoint so we can adopt the startup window and register bindings without
 * opting out of framework auto-detection.
 *
 * Do not construct a second BrowserWindow here unless you want multi-window.
 */
/// <reference lib="deno.ns" />
/// <reference lib="deno.desktop" />

const win = new Deno.BrowserWindow({
  title: "Tangerine",
  width: 1280,
  height: 840,
});

/** Keep OAuth / external redirects inside the desktop window (CEF cookie jar). */
win.bind("navigate", async (url: string) => {
  if (typeof url !== "string" || url.length === 0) {
    throw new TypeError("navigate(url) requires a non-empty string");
  }
  win.navigate(url);
});

if (Deno.env.get("DENO_DESKTOP_DEVTOOLS") === "1") {
  win.openDevtools();
}
