import { getAuth } from "@/lib/auth.server";
import { getGithubAccessToken } from "@repo/auth";
import { getRequestHeaders } from "@tanstack/react-start/server";

/** Process-scoped token for Conveyor workers (no HTTP request headers). */
let workerGithubToken: string | null = null;

/**
 * Remembers a GitHub token for background workers in this process.
 * Call from HTTP kickoff so list/embed workers can page after the request ends.
 */
export function rememberGithubTokenForWorkers(token: string): void {
  workerGithubToken = token.trim() || null;
}

/** Clears the worker token cache (e.g. on sign-out). */
export function clearWorkerGithubToken(): void {
  workerGithubToken = null;
}

/**
 * Resolves a GitHub token: request OAuth → worker cache → `GH_PAT`.
 */
export async function getGithubToken(): Promise<string> {
  try {
    const headers = getRequestHeaders();
    const oauthToken = await getGithubAccessToken(getAuth(), headers);
    if (oauthToken) {
      rememberGithubTokenForWorkers(oauthToken);
      return oauthToken;
    }
  } catch {
    // Outside a request (or missing session) — try worker cache / PAT.
  }

  if (workerGithubToken) {
    return workerGithubToken;
  }

  const pat = process.env.GH_PAT?.trim();
  if (!pat) {
    throw new Error("Sign in with GitHub or set GH_PAT to load repositories.");
  }
  return pat;
}
