import { authClient, authClientErrorMessage } from "@/lib/auth-client";

let cachedToken: string | null = null;
let inflight: Promise<string> | null = null;

/**
 * Better Auth account row `id` for the GitHub provider (not the GitHub user id).
 * Required by `/get-access-token` when accounts live in the DB (apps/api).
 */
async function resolveGithubAccountRowId(): Promise<string> {
  const listed = await authClient.listAccounts();
  const accounts = listed.data;
  if (!accounts?.length) {
    const message =
      authClientErrorMessage(listed.error) ??
      listed.error?.message ??
      "No linked accounts. Sign out and sign in with GitHub again.";
    throw new Error(message);
  }

  const github = accounts.find((account) => account.providerId === "github");
  if (!github?.id) {
    throw new Error("GitHub account not linked. Sign out and sign in again.");
  }

  return github.id;
}

/**
 * Resolves the signed-in user's GitHub OAuth token from apps/api (DB-backed account).
 */
export async function getClientGithubAccessToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  if (inflight) return inflight;

  inflight = (async () => {
    const accountId = await resolveGithubAccountRowId();
    const result = await authClient.getAccessToken({ accountId });

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
