/// <reference lib="deno.ns" />

import { logDesktopAuth } from "../evlog.ts";
import { authBase, readConfig } from "./config.ts";
import { apiHeaders } from "./cookies.ts";
import { clearStored, loadStored, saveStored } from "./session-store.ts";
import type { DesktopAuthSession, DesktopAuthUser, StoredSession } from "./types.ts";

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
  const data = (await res.json()) as {
    user?: DesktopAuthUser;
    session?: { token?: string };
  } | null;
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
