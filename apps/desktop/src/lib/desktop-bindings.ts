/**
 * Typed access to Deno Desktop `bindings` injected into the webview.
 * Absent outside `deno desktop` (browser `pnpm dev`).
 */

export type DesktopBindings = {
  navigate: (url: string) => Promise<void>;
};

declare global {
  // Deno Desktop injects this proxy into the renderer.
  var bindings: DesktopBindings | undefined;
}

/**
 * True when running inside a `deno desktop` webview with bindings available.
 */
export function hasDesktopBindings(): boolean {
  return typeof globalThis.bindings?.navigate === "function";
}

/**
 * Navigate via Deno Desktop when available; otherwise use the browser location.
 */
export async function desktopNavigate(url: string): Promise<void> {
  if (hasDesktopBindings()) {
    await globalThis.bindings!.navigate(url);
    return;
  }
  globalThis.location.assign(url);
}
