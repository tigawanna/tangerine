import { authClient, authClientErrorMessage } from "@/lib/auth-client";

let cachedToken: string | null = null;
let inflight: Promise<string> | null = null;

/**
 * Resolves the signed-in user's GitHub OAuth token from the Better Auth
 * account cookie. Dedupes concurrent callers and caches until sign-out /
 * explicit clear so dashboard navigations do not hammer `/get-access-token`.
 */
export async function getClientGithubAccessToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  if (inflight) return inflight;

  inflight = (async () => {
    const result = await authClient.getAccessToken({
      useAccountCookie: true,
    });

    const accessToken = result.data?.accessToken;
    if (!accessToken) {
      const status =
        result.error && typeof result.error === "object" && "status" in result.error
          ? result.error.status
          : undefined;
      const message =
        authClientErrorMessage(result.error) ??
        result.error?.message ??
        "GitHub access token unavailable. Sign out and sign in again.";
      const error = new Error(message);
      if (status !== undefined) {
        Object.assign(error, { status });
      }
      throw error;
    }

    cachedToken = accessToken;
    return accessToken;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/** Drop the cached token (e.g. after sign-out or forced re-auth). */
export function clearClientGithubAccessToken(): void {
  cachedToken = null;
  inflight = null;
}
