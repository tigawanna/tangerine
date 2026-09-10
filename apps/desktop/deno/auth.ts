/**
 * Deno Desktop Better Auth client (Electron-shaped, no Electron deps).
 *
 * Mirrors @better-auth/electron's requestAuth / authenticate contract against
 * apps/api's `electron()` plugin:
 *   1. PKCE in the Deno runtime (not the webview)
 *   2. System browser opens web `/auth` (or init-oauth-proxy)
 *   3. Return via loopback `http://127.0.0.1:<port>/callback?token=…`
 *      (fragments are not sent to HTTP servers — query only)
 *   4. Fallback: paste the redirect token from the browser
 *   5. POST /api/auth/electron/token → store session cookies on disk
 *
 * deepLinks in deno.json register the OS scheme for later; Deno does not yet
 * deliver open-url events, so we do not rely on them for the return path.
 */
/// <reference lib="deno.ns" />

import { logDesktopAuth } from "./evlog.ts";

/** Must match `ELECTRON_PROTOCOL_SCHEME` in `@repo/auth` / electron-builder. */
const PROTOCOL_SCHEME = "com.tigawanna.tangerine";
const CLIENT_ID = "electron";
const COOKIE_PREFIX = "better-auth";
/** Stable loopback port so HMR / re-sign-in does not orphan the browser URL. */
const DEFAULT_LOOPBACK_PORT = 17832;
const PKCE = Symbol.for("tangerine:deno-desktop-pkce");
const LOOPBACK = Symbol.for("tangerine:deno-desktop-loopback");

type PkceMap = Map<string, string>;
type CookieJar = Record<string, { value: string; expires: string | null }>;

type LoopbackHandle = {
  abort: AbortController;
  port: number;
  /** Keep a strong ref so Deno.serve is not GC'd after requestAuth returns. */
  server: Deno.HttpServer;
};

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

type AuthConfig = {
  /** Better Auth server (apps/api), e.g. http://localhost:5000 */
  betterAuthUrl: string;
  /** Browser sign-in page (apps/web), e.g. http://localhost:3064/auth */
  signInURL: string;
};

function pkceStore(): PkceMap {
  const g = globalThis as typeof globalThis & { [PKCE]?: PkceMap };
  g[PKCE] ??= new Map();
  return g[PKCE];
}

function loopbackHandle(): LoopbackHandle | undefined {
  const g = globalThis as typeof globalThis & { [LOOPBACK]?: LoopbackHandle };
  return g[LOOPBACK];
}

function setLoopbackHandle(next: LoopbackHandle | undefined): void {
  const g = globalThis as typeof globalThis & { [LOOPBACK]?: LoopbackHandle };
  if (next) g[LOOPBACK] = next;
  else delete g[LOOPBACK];
}

function configDir(): string {
  const home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? ".";
  return `${home}/.config/tangerine-desktop`;
}

function sessionPath(): string {
  return `${configDir()}/session.json`;
}

function pkcePath(): string {
  return `${configDir()}/pkce.json`;
}

function loopbackPort(): number {
  const raw = Deno.env.get("DESKTOP_AUTH_LOOPBACK_PORT");
  const n = raw ? Number(raw) : DEFAULT_LOOPBACK_PORT;
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : DEFAULT_LOOPBACK_PORT;
}

async function loadPkceDisk(): Promise<Record<string, string>> {
  try {
    const parsed = JSON.parse(await Deno.readTextFile(pkcePath())) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function savePkceDisk(map: Record<string, string>): Promise<void> {
  await Deno.mkdir(configDir(), { recursive: true });
  await Deno.writeTextFile(pkcePath(), JSON.stringify(map));
}

async function rememberPkce(state: string, verifier: string): Promise<void> {
  pkceStore().set(state, verifier);
  const disk = await loadPkceDisk();
  disk[state] = verifier;
  const entries = Object.entries(disk);
  const trimmed =
    entries.length > 20 ? Object.fromEntries(entries.slice(entries.length - 20)) : disk;
  await savePkceDisk(trimmed);
}

/** Read PKCE without consuming — retries / Strict Mode remounts must not wipe it. */
async function peekPkce(state: string): Promise<string | undefined> {
  const memory = pkceStore().get(state);
  if (memory) return memory;
  const disk = await loadPkceDisk();
  return disk[state];
}

async function clearPkce(state: string): Promise<void> {
  pkceStore().delete(state);
  const disk = await loadPkceDisk();
  if (!(state in disk)) return;
  delete disk[state];
  await savePkceDisk(disk);
}

function readConfig(): AuthConfig {
  // Prefer VITE_API_URL — BETTER_AUTH_URL is easy to leave pointing at the
  // desktop Vite port (:3070), which 404s on /api/auth/electron/token.
  const betterAuthUrl = (
    Deno.env.get("VITE_API_URL") ??
    Deno.env.get("BETTER_AUTH_URL") ??
    "http://localhost:5000"
  ).replace(/\/$/, "");
  const signInURL =
    Deno.env.get("VITE_SIGN_IN_URL") ??
    Deno.env.get("SIGN_IN_URL") ??
    "http://localhost:3064/auth";
  return { betterAuthUrl, signInURL };
}

function authBase(cfg: AuthConfig): string {
  return `${cfg.betterAuthUrl}/api/auth`;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function randomString(length: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

/** Open a URL in the OS default browser (system browser OAuth). */
export async function openExternal(url: string): Promise<void> {
  const os = Deno.build.os;
  const cmd =
    os === "darwin"
      ? ["open", url]
      : os === "windows"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  const proc = new Deno.Command(cmd[0]!, {
    args: cmd.slice(1),
    stdout: "null",
    stderr: "null",
  });
  const status = await proc.spawn().status;
  if (!status.success) {
    throw new Error(`Failed to open system browser (${cmd[0]})`);
  }
}

function cookieHeader(jar: CookieJar): string {
  const now = Date.now();
  const pairs: string[] = [];
  for (const [key, entry] of Object.entries(jar)) {
    if (entry.expires && new Date(entry.expires).getTime() < now) continue;
    // Values come from Set-Cookie / set-auth-token — do not re-encode.
    pairs.push(`${key}=${entry.value}`);
  }
  return pairs.join("; ");
}

/**
 * API request headers for a stored desktop session.
 * Prefer Bearer (raw session token) — signed cookie jars are easy to get wrong,
 * and apps/api enables the `bearer()` plugin for this path.
 *
 * Origin must match `ELECTRON_TRUSTED_ORIGIN` — Better Auth CSRF rejects
 * cookie-bearing POSTs with a missing/null Origin (same as @better-auth/electron).
 */
function apiHeaders(stored: StoredSession, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("origin", `${PROTOCOL_SCHEME}:/`);
  const cookie = cookieHeader(stored.cookies);
  if (cookie) headers.set("cookie", cookie);
  if (stored.token) headers.set("authorization", `Bearer ${stored.token}`);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return headers;
}

function mergeSetCookie(jar: CookieJar, setCookie: string | null): CookieJar {
  if (!setCookie) return jar;
  const next = { ...jar };
  // Multiple Set-Cookie may arrive comma-joined; split carefully on ", <name>="
  const parts = setCookie.split(/,(?=\s*[^;=]+=)/);
  for (const part of parts) {
    const [pair, ...attrs] = part.split(";").map((s) => s.trim());
    if (!pair) continue;
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    let expires: string | null = null;
    for (const attr of attrs) {
      const lower = attr.toLowerCase();
      if (lower.startsWith("max-age=")) {
        const maxAge = Number(attr.slice(8));
        if (Number.isFinite(maxAge)) {
          expires = new Date(Date.now() + maxAge * 1000).toISOString();
        }
      } else if (lower.startsWith("expires=")) {
        expires = new Date(attr.slice(8)).toISOString();
      }
    }
    next[name] = { value, expires };
  }
  return next;
}

type StoredSession = {
  cookies: CookieJar;
  user: DesktopAuthUser;
  token: string;
};

async function loadStored(): Promise<StoredSession | null> {
  try {
    const raw = await Deno.readTextFile(sessionPath());
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function saveStored(session: StoredSession): Promise<void> {
  await Deno.mkdir(configDir(), { recursive: true });
  await Deno.writeTextFile(sessionPath(), JSON.stringify(session, null, 2));
}

async function clearStored(): Promise<void> {
  try {
    await Deno.remove(sessionPath());
  } catch {
    // ignore
  }
}

function decodeRedirectToken(token: string): { identifier: string; state: string } {
  const decoded = JSON.parse(new TextDecoder().decode(base64UrlDecode(decodeURIComponent(token)))) as {
    identifier?: string;
    state?: string;
  };
  if (!decoded?.identifier || !decoded?.state) {
    throw new Error("Invalid authorization token (expected base64 JSON with identifier + state)");
  }
  return { identifier: decoded.identifier, state: decoded.state };
}

type AuthListeners = {
  onAuthenticated?: (user: DesktopAuthUser) => void;
  onAuthError?: (message: string) => void;
};

let listeners: AuthListeners = {};

export function setAuthListeners(next: AuthListeners): void {
  listeners = next;
}

/**
 * Start system-browser OAuth. Starts a loopback callback server and opens
 * apps/web `/auth` with PKCE query params (+ `loopback` for automatic return).
 */
export async function requestAuth(options?: {
  provider?: string;
}): Promise<{ loopback: string; state: string }> {
  const cfg = readConfig();
  const state = randomString(16);
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  await rememberPkce(state, codeVerifier);

  const loopback = await startLoopbackServer();

  let url: URL;
  if (options?.provider) {
    url = new URL(`${authBase(cfg)}/electron/init-oauth-proxy`);
    url.searchParams.set("provider", options.provider);
  } else {
    url = new URL(cfg.signInURL);
  }
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("loopback", loopback);

  logDesktopAuth("desktop.auth.request", {
    betterAuthUrl: cfg.betterAuthUrl,
    signInURL: cfg.signInURL,
    authBase: authBase(cfg),
    loopback,
    state,
    via: options?.provider ? "init-oauth-proxy" : "web-auth",
    provider: options?.provider ?? "github",
  });

  await openExternal(url.toString());
  return { loopback, state };
}

let startingLoopback: Promise<string> | null = null;

/**
 * Ensure the OAuth loopback is listening. Safe to call at startup and from
 * `requestAuth`. Probes `/health` so HMR cannot reuse a dead Symbol handle.
 */
export async function startLoopbackServer(): Promise<string> {
  if (startingLoopback) return startingLoopback;
  startingLoopback = ensureLoopbackServer().finally(() => {
    startingLoopback = null;
  });
  return startingLoopback;
}

async function probeLoopback(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(750),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureLoopbackServer(): Promise<string> {
  const preferredPort = loopbackPort();
  const existing = loopbackHandle();
  if (existing && (await probeLoopback(existing.port))) {
    const callbackUrl = `http://127.0.0.1:${existing.port}/callback`;
    logDesktopAuth("desktop.auth.loopback_listen", {
      reused: true,
      port: existing.port,
      preferredPort,
      loopback: callbackUrl,
    });
    return callbackUrl;
  }

  existing?.abort.abort();
  try {
    await existing?.server.shutdown();
  } catch {
    // already closed
  }
  setLoopbackHandle(undefined);

  const abort = new AbortController();
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type, accept, x-tangerine-handoff",
  } as const;

  let resolveListen: ((addr: { hostname: string; port: number }) => void) | undefined;
  let rejectListen: ((error: unknown) => void) | undefined;
  const listened = new Promise<{ hostname: string; port: number }>((resolve, reject) => {
    resolveListen = resolve;
    rejectListen = reject;
  });

  // Deno Desktop may remap the requested port — always trust onListen.
  let boundPort = preferredPort;

  try {
    const server = Deno.serve(
      {
        hostname: "127.0.0.1",
        port: preferredPort,
        signal: abort.signal,
        onListen: (addr) => {
          boundPort = addr.port;
          resolveListen?.(addr);
          logDesktopAuth("desktop.auth.loopback_listen", {
            reused: false,
            port: addr.port,
            preferredPort,
            remapped: addr.port !== preferredPort,
            hostname: addr.hostname,
            loopback: `http://127.0.0.1:${addr.port}/callback`,
          });
        },
      },
      async (req: Request) => {
        if (req.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: corsHeaders });
        }

        const url = new URL(req.url);
        if (url.pathname === "/health") {
          return Response.json({ ok: true }, { headers: corsHeaders });
        }
        if (url.pathname !== "/callback") {
          return new Response("Not found", {
            status: 404,
            headers: corsHeaders,
          });
        }

        const token = url.searchParams.get("token");
        const wantsJson =
          req.headers.get("accept")?.includes("application/json") ||
          req.headers.get("x-tangerine-handoff") === "1";

        if (!token) {
          logDesktopAuth(
            "desktop.auth.loopback",
            { ok: false, reason: "missing_token", path: url.pathname, port: boundPort },
            "warn",
          );
          if (wantsJson) {
            return Response.json(
              { ok: false, error: "missing_token" },
              { status: 400, headers: corsHeaders },
            );
          }
          return new Response(
            "<!doctype html><p>Missing token. Close this tab and paste the code in the app.</p>",
            {
              status: 400,
              headers: { ...corsHeaders, "content-type": "text/html; charset=utf-8" },
            },
          );
        }

        try {
          logDesktopAuth("desktop.auth.loopback", {
            ok: true,
            tokenLength: token.length,
            path: url.pathname,
            port: boundPort,
            via: wantsJson ? "fetch" : "navigation",
          });
          await authenticate({ token });
          if (wantsJson) {
            return Response.json({ ok: true }, { headers: corsHeaders });
          }
          return new Response(
            `<!doctype html><title>Signed in</title>
             <p>Signed in. You can close this tab and return to Tangerine.</p>
             <script>window.close()</script>`,
            {
              headers: { ...corsHeaders, "content-type": "text/html; charset=utf-8" },
            },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Authentication failed";
          logDesktopAuth(
            "desktop.auth.loopback",
            { ok: false, message, port: boundPort },
            "error",
          );
          listeners.onAuthError?.(message);
          if (wantsJson) {
            return Response.json(
              { ok: false, error: message },
              { status: 400, headers: corsHeaders },
            );
          }
          return new Response(`<!doctype html><p>${message}</p>`, {
            status: 400,
            headers: { ...corsHeaders, "content-type": "text/html; charset=utf-8" },
          });
        }
      },
    );

    await Promise.race([
      listened,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("loopback onListen timed out")), 3000);
      }),
    ]);

    const callbackUrl = `http://127.0.0.1:${boundPort}/callback`;
    setLoopbackHandle({ abort, port: boundPort, server });

    if (!(await probeLoopback(boundPort))) {
      abort.abort();
      setLoopbackHandle(undefined);
      throw new Error(`loopback health check failed after bind on ${boundPort}`);
    }

    return callbackUrl;
  } catch (error) {
    rejectListen?.(error);
    setLoopbackHandle(undefined);
    const message = error instanceof Error ? error.message : String(error);
    logDesktopAuth(
      "desktop.auth.loopback_listen",
      { ok: false, port: preferredPort, message },
      "error",
    );
    throw new Error(`Desktop auth loopback failed (preferred ${preferredPort}). (${message})`);
  }
}

/**
 * Exchange the Better Auth Electron redirect token for an API session.
 * `token` is the base64url JSON from the redirect cookie / loopback query
 * (not the raw 32-char identifier alone).
 */
export async function authenticate(input: { token: string }): Promise<DesktopAuthSession> {
  const cfg = readConfig();
  const exchangeUrl = `${authBase(cfg)}/electron/token`;
  const { identifier, state } = decodeRedirectToken(input.token);
  const codeVerifier = await peekPkce(state);
  if (!codeVerifier) {
    // Idempotent: a prior successful exchange (or Strict Mode remount) may have
    // already cleared PKCE — if we already have a session, treat as success.
    const existing = await getSession();
    if (existing) {
      logDesktopAuth("desktop.auth.exchange", {
        ok: true,
        reason: "already_signed_in",
        state,
      });
      listeners.onAuthenticated?.(existing.user);
      return existing;
    }
    logDesktopAuth(
      "desktop.auth.exchange",
      { ok: false, reason: "missing_code_verifier", state, exchangeUrl },
      "error",
    );
    throw new Error("Code verifier not found — start Sign in again from the desktop app.");
  }

  logDesktopAuth("desktop.auth.exchange", {
    phase: "start",
    exchangeUrl,
    betterAuthUrl: cfg.betterAuthUrl,
    state,
    identifierLength: identifier.length,
  });

  const res = await fetch(exchangeUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: identifier,
      state,
      code_verifier: codeVerifier,
    }),
  });

  const setCookies =
    typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const setCookie =
    setCookies.length > 0 ? setCookies.join(", ") : res.headers.get("set-cookie");
  // Bearer plugin exposes the signed session cookie value on success responses.
  const setAuthToken = res.headers.get("set-auth-token");

  if (!res.ok) {
    const text = await res.text();
    logDesktopAuth(
      "desktop.auth.exchange",
      {
        phase: "response",
        ok: false,
        status: res.status,
        exchangeUrl,
        bodyPreview: text.slice(0, 200),
      },
      "error",
    );
    throw new Error(text || `Token exchange failed (${res.status})`);
  }

  // Only consume PKCE after a successful exchange so retries can reuse it.
  await clearPkce(state);

  const data = (await res.json()) as { token: string; user: DesktopAuthUser };
  const prev = (await loadStored())?.cookies ?? {};
  const cookies = mergeSetCookie(prev, setCookie);
  if (setAuthToken) {
    cookies[`${COOKIE_PREFIX}.session_token`] = {
      value: setAuthToken,
      expires: null,
    };
  } else if (data.token && !Object.keys(cookies).some((k) => k.includes("session_token"))) {
    // Fallback: raw DB token — API calls must use Authorization: Bearer.
    cookies[`${COOKIE_PREFIX}.session_token`] = {
      value: data.token,
      expires: null,
    };
  }

  const session: DesktopAuthSession = {
    user: data.user,
    token: data.token,
  };
  await saveStored({ cookies, user: data.user, token: data.token });
  logDesktopAuth("desktop.auth.exchange", {
    phase: "success",
    status: res.status,
    userId: data.user.id,
    githubUsername: data.user.githubUsername ?? null,
    cookieNames: Object.keys(cookies),
    hasSetAuthToken: Boolean(setAuthToken),
    setCookieCount: setCookies.length,
  });
  console.log(
    `[tangerine-desktop] signed in as ${data.user.githubUsername ?? data.user.id}`,
  );
  listeners.onAuthenticated?.(data.user);
  return session;
}

export async function getSession(): Promise<DesktopAuthSession | null> {
  const stored = await loadStored();
  if (!stored) return null;

  const cfg = readConfig();
  const res = await fetch(`${authBase(cfg)}/get-session`, {
    method: "GET",
    headers: apiHeaders(stored),
  });
  if (!res.ok) {
    logDesktopAuth("desktop.auth.get_session", { ok: false, status: res.status }, "warn");
    // Keep disk session — transient API failures should not force re-login.
    return { user: stored.user, token: stored.token };
  }
  const data = (await res.json()) as { user?: DesktopAuthUser; session?: { token?: string } } | null;
  if (!data?.user) {
    // Session revoked server-side.
    await clearStored();
    logDesktopAuth("desktop.auth.get_session", { ok: false, reason: "no_user" }, "warn");
    return null;
  }
  const token = data.session?.token ?? stored.token;
  const next = { cookies: stored.cookies, user: data.user, token };
  await saveStored(next);
  logDesktopAuth("desktop.auth.get_session", {
    ok: true,
    userId: data.user.id,
    githubUsername: data.user.githubUsername ?? null,
  });
  return { user: data.user, token };
}

export async function signOut(): Promise<void> {
  const stored = await loadStored();
  const cfg = readConfig();
  if (stored) {
    try {
      await fetch(`${authBase(cfg)}/sign-out`, {
        method: "POST",
        headers: apiHeaders(stored),
        body: "{}",
      });
    } catch {
      // clear local anyway
    }
  }
  await clearStored();
}

/**
 * Better Auth account row `id` for GitHub (body field for `/get-access-token`).
 */
async function resolveGithubAccountRowId(stored: StoredSession): Promise<string> {
  const cfg = readConfig();
  const listRes = await fetch(`${authBase(cfg)}/list-accounts`, {
    headers: apiHeaders(stored),
  });
  if (!listRes.ok) {
    const text = await listRes.text();
    throw new Error(text || `list-accounts failed (${listRes.status})`);
  }
  const accounts = (await listRes.json()) as Array<{
    id?: string;
    providerId?: string;
  }>;
  const github = accounts.find((account) => account.providerId === "github");
  if (!github?.id) {
    throw new Error("GitHub account not linked. Sign out and sign in again.");
  }
  return github.id;
}

/**
 * GitHub OAuth access token for the signed-in account (API-backed).
 */
export async function getGithubAccessToken(): Promise<string> {
  const stored = await loadStored();
  if (!stored) throw new Error("Not signed in");

  const cfg = readConfig();
  // Better Auth 1.7: body is `{ accountId }` (row id) or `{ useAccountCookie: true }`.
  const accountId = await resolveGithubAccountRowId(stored);
  const res = await fetch(`${authBase(cfg)}/get-access-token`, {
    method: "POST",
    headers: apiHeaders(stored),
    body: JSON.stringify({ accountId }),
  });
  if (!res.ok) {
    const text = await res.text();
    logDesktopAuth(
      "desktop.auth.github_token",
      { ok: false, status: res.status, bodyPreview: text.slice(0, 200) },
      "error",
    );
    throw new Error(text || `get-access-token failed (${res.status})`);
  }
  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) {
    logDesktopAuth("desktop.auth.github_token", { ok: false, reason: "empty_token" }, "error");
    throw new Error("GitHub access token unavailable");
  }
  logDesktopAuth("desktop.auth.github_token", {
    ok: true,
    accountIdPrefix: accountId.slice(0, 8),
  });
  return data.accessToken;
}

export function scheme(): string {
  return PROTOCOL_SCHEME;
}
