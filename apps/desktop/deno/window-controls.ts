/**
 * Window chrome helpers for `deno desktop`.
 *
 * Public docs only list size/position/`close` — but the runtime binary also
 * exposes `minimize` / `maximize` (undocumented). Probe at runtime and fall
 * back to `setSize` for maximize when needed.
 *
 * @see https://docs.deno.com/runtime/desktop/windows/
 * @see https://docs.deno.com/runtime/desktop/menus/
 */
/// <reference lib="deno.ns" />
/// <reference lib="deno.desktop" />

/** Undocumented controls present on some Deno desktop builds. */
type WindowChrome = Deno.BrowserWindow & {
  minimize?: () => void;
  maximize?: () => void;
  unmaximize?: () => void;
  isMaximized?: () => boolean;
};

function asChrome(win: Deno.BrowserWindow): WindowChrome {
  return win as WindowChrome;
}

let restoreGeometry: {
  width: number;
  height: number;
  x: number;
  y: number;
} | null = null;

export function windowMinimize(win: Deno.BrowserWindow): void {
  const chrome = asChrome(win);
  if (typeof chrome.minimize === "function") {
    chrome.minimize();
    return;
  }
  // Last resort — no public minimize API when the method is missing.
  win.hide();
}

export function windowClose(win: Deno.BrowserWindow): void {
  win.close();
}

export async function windowToggleMaximize(win: Deno.BrowserWindow): Promise<void> {
  const chrome = asChrome(win);

  if (typeof chrome.isMaximized === "function" && typeof chrome.unmaximize === "function") {
    if (chrome.isMaximized()) {
      chrome.unmaximize();
      return;
    }
  }

  if (typeof chrome.maximize === "function") {
    // Toggle: if we already maximized via setSize, restore first.
    if (restoreGeometry) {
      win.setSize(restoreGeometry.width, restoreGeometry.height);
      win.setPosition(restoreGeometry.x, restoreGeometry.y);
      restoreGeometry = null;
      return;
    }
    chrome.maximize();
    return;
  }

  await maximizeViaScreen(win);
}

async function maximizeViaScreen(win: Deno.BrowserWindow): Promise<void> {
  if (restoreGeometry) {
    win.setSize(restoreGeometry.width, restoreGeometry.height);
    win.setPosition(restoreGeometry.x, restoreGeometry.y);
    restoreGeometry = null;
    return;
  }

  const [width, height] = win.getSize();
  const [x, y] = win.getPosition();
  restoreGeometry = { width, height, x, y };

  try {
    const screen = (await win.executeJs(
      `({ w: window.screen.availWidth, h: window.screen.availHeight })`,
    )) as { w?: number; h?: number };
    if (typeof screen?.w === "number" && typeof screen?.h === "number" && screen.w > 0 && screen.h > 0) {
      win.setPosition(0, 0);
      win.setSize(Math.floor(screen.w), Math.floor(screen.h));
      return;
    }
  } catch {
    // fall through
  }
  restoreGeometry = null;
}

export async function windowToggleFullscreen(win: Deno.BrowserWindow): Promise<void> {
  try {
    await win.executeJs(`(() => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    })()`);
  } catch {
    // Some backends reject fullscreen without a trusted gesture.
  }
}
