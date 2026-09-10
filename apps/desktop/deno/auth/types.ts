/// <reference lib="deno.ns" />

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

export type AuthConfig = {
  /** Better Auth server (apps/api), e.g. http://localhost:5000 */
  betterAuthUrl: string;
  /** Browser sign-in page (apps/web), e.g. http://localhost:3064/auth */
  signInURL: string;
};

export type CookieJar = Record<string, { value: string; expires: string | null }>;

export type StoredSession = {
  cookies: CookieJar;
  user: DesktopAuthUser;
  token: string;
};

export type LoopbackHandle = {
  abort: AbortController;
  port: number;
  /** Keep a strong ref so Deno.serve is not GC'd after requestAuth returns. */
  server: Deno.HttpServer;
};

export type AuthListeners = {
  onAuthenticated?: (user: DesktopAuthUser) => void;
  onAuthError?: (message: string) => void;
};
