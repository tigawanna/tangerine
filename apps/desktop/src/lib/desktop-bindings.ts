/**
 * Typed access to Deno Desktop `bindings` injected into the webview.
 * Absent outside `deno desktop` (browser `pnpm dev`).
 */

export type DesktopAuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  githubUsername?: string | null;
};

export type DesktopAuthSession = {
  user: DesktopAuthUser;
  token: string;
};

export type DesktopBindings = {
  navigate: (url: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  requestAuth: (options?: { provider?: string }) => Promise<{ loopback: string; state: string }>;
  authenticate: (input: { token: string }) => Promise<DesktopAuthSession>;
  getSession: () => Promise<DesktopAuthSession | null>;
  signOut: () => Promise<void>;
  getGithubAccessToken: () => Promise<string>;
};

declare global {
  // Deno Desktop injects this proxy into the renderer.
  var bindings: DesktopBindings | undefined;
}

/** True when running inside a `deno desktop` webview with bindings available. */
export function hasDesktopBindings(): boolean {
  return typeof globalThis.bindings?.requestAuth === "function";
}

export async function desktopNavigate(url: string): Promise<void> {
  if (hasDesktopBindings() && globalThis.bindings?.navigate) {
    await globalThis.bindings.navigate(url);
    return;
  }
  globalThis.location.assign(url);
}
