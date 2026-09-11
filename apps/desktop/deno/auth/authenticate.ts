/// <reference lib="deno.ns" />

import { logDesktopAuth } from "../evlog.ts";
import { authBase, readConfig } from "./config.ts";
import { COOKIE_PREFIX } from "./constants.ts";
import { mergeSetCookie } from "./cookies.ts";
import { decodeRedirectToken } from "./crypto.ts";
import { getAuthListeners } from "./listeners.ts";
import { clearPkce, peekPkce } from "./pkce.ts";
import { getSession } from "./session.ts";
import { loadStored, saveStored } from "./session-store.ts";
import type { DesktopAuthSession, DesktopAuthUser } from "./types.ts";

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
      getAuthListeners().onAuthenticated?.(existing.user);
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
  const setCookie = setCookies.length > 0 ? setCookies.join(", ") : res.headers.get("set-cookie");
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
  console.log(`[tangerine-desktop] signed in as ${data.user.githubUsername ?? data.user.id}`);
  getAuthListeners().onAuthenticated?.(data.user);
  return session;
}
