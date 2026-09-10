/// <reference lib="deno.ns" />

import { logDesktopAuth } from "../evlog.ts";
import { authBase, readConfig } from "./config.ts";
import { CLIENT_ID } from "./constants.ts";
import { base64UrlEncode, generateCodeChallenge, randomString } from "./crypto.ts";
import { startLoopbackServer } from "./loopback.ts";
import { openExternal } from "./open-external.ts";
import { rememberPkce } from "./pkce.ts";

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
