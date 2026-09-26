/**
 * Native application menu for `deno desktop`.
 *
 * Per the menus docs: `role` items are OS-handled and never emit `menuclick`.
 * Use roles for standard commands (`minimize`, edit roles, `quit`). Maximize has
 * no role, and on Linux some roles are inert — Window maximize/close stay as
 * custom items wired through `menuclick` → BrowserWindow APIs; CmdOrCtrl+M
 * still falls back to `windowMinimize` via keydown.
 *
 * @see https://docs.deno.com/runtime/desktop/menus/
 * @see https://docs.deno.com/runtime/desktop/windows/
 */
/// <reference lib="deno.ns" />
/// <reference lib="deno.desktop" />

import {
  windowClose,
  windowMinimize,
  windowToggleFullscreen,
  windowToggleMaximize,
} from "./window-controls.ts";

function role(name: string): Deno.MenuItem {
  return { role: { role: name } };
}

function item(label: string, id: string, accelerator?: string): Deno.MenuItem {
  return {
    item: {
      label,
      id,
      accelerator,
      enabled: true,
    },
  };
}

/** Default app / edit / view / window chrome for Tangerine. */
export function tangerineApplicationMenu(): Deno.MenuItem[] {
  return [
    {
      submenu: {
        label: "Tangerine",
        items: [
          // Keep quit as a role (docs), but also ship an explicit Quit item —
          // roles are unreliable on some Linux/webview builds.
          item("Quit", "quit", "CmdOrCtrl+Q"),
          role("quit"),
        ],
      },
    },
    {
      submenu: {
        label: "Edit",
        items: [
          role("undo"),
          role("redo"),
          "separator",
          role("cut"),
          role("copy"),
          role("paste"),
          role("selectAll"),
        ],
      },
    },
    {
      submenu: {
        label: "View",
        items: [
          item("Reload", "reload", "CmdOrCtrl+R"),
          item("Toggle Full Screen", "fullscreen", "F11"),
        ],
      },
    },
    {
      submenu: {
        label: "Window",
        items: [
          // Native OS minimize (docs role). Maximize has no role — custom item.
          role("minimize"),
          item("Maximize", "maximize"),
          "separator",
          item("Close", "close", "CmdOrCtrl+W"),
        ],
      },
    },
  ];
}

/**
 * Install the menu and handle `menuclick` / keyboard fallbacks.
 * Call once after constructing the window.
 */
export function installApplicationMenu(win: Deno.BrowserWindow): void {
  win.setApplicationMenu(tangerineApplicationMenu());

  const onMenu = (id: string | undefined) => {
    if (!id) return;
    switch (id) {
      case "quit":
        Deno.exit(0);
        return;
      case "reload":
        win.reload();
        return;
      case "fullscreen":
        void windowToggleFullscreen(win);
        return;
      case "maximize":
        void windowToggleMaximize(win);
        return;
      case "close":
        windowClose(win);
        return;
    }
  };

  // Docs pattern: listen for menuclick and switch on e.detail.id
  win.addEventListener("menuclick", (e) => {
    onMenu(e.detail.id);
  });

  // Accelerators sometimes fail to route through the menu on Linux webview —
  // mirror the important ones on the window keydown bridge.
  win.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (key === "f11") {
      e.preventDefault();
      void windowToggleFullscreen(win);
      return;
    }
    if (mod && key === "q") {
      e.preventDefault();
      Deno.exit(0);
      return;
    }
    if (mod && key === "w") {
      e.preventDefault();
      windowClose(win);
      return;
    }
    if (mod && key === "m") {
      e.preventDefault();
      windowMinimize(win);
      return;
    }
    if (mod && key === "r") {
      e.preventDefault();
      win.reload();
    }
  });
}
