import { getAuth } from "@/lib/auth.server";
import { getGithubAccessToken } from "@repo/auth";
import { getRequestHeaders } from "@tanstack/react-start/server";

/**
 * Resolves a GitHub token: the signed-in user's OAuth token, else `GH_PAT`.
 */
export async function getGithubToken(): Promise<string> {
  try {
    const headers = getRequestHeaders();
    const oauthToken = await getGithubAccessToken(getAuth(), headers);
    if (oauthToken) {
      return oauthToken;
    }
  } catch {
    // Public routes / missing session fall through to GH_PAT.
  }

  const pat = process.env.GH_PAT?.trim();
  if (!pat) {
    throw new Error("Sign in with GitHub or set GH_PAT to load repositories.");
  }
  return pat;
}
