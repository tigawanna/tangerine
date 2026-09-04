import type { Auth } from "./create-auth";

/**
 * Returns a valid GitHub OAuth access token for the signed-in user.
 *
 * With no database, the GitHub account lives in the signed account cookie.
 */
export async function getGithubAccessToken(
  auth: Auth,
  headers: HeadersInit,
): Promise<string | null> {
  try {
    const tokens = await auth.api.getAccessToken({
      headers: new Headers(headers),
      // Cookie-session auth (no DB): select the signed account cookie, not providerId.
      body: { useAccountCookie: true as const },
    });
    return tokens.accessToken ?? null;
  } catch {
    return null;
  }
}
