import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import { createGitHubClient, type GitHubClient } from "@repo/github";

/**
 * Browser GitHub client for the signed-in dashboard session.
 * Uses the cached Better Auth account-cookie token (same source as Relay).
 */
export async function getClientGitHubClient(): Promise<GitHubClient> {
  return createGitHubClient(await getClientGithubAccessToken());
}
