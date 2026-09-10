import { getClientGitHubClient } from "@/lib/github/client";
import type { DeleteReposResult, DeleteReposTarget } from "@repo/github";

/**
 * Deletes repositories with the signed-in user's token (browser → GitHub REST).
 * Requires the GitHub `delete_repo` OAuth scope.
 */
export async function deleteGithubRepos(
  repos: readonly DeleteReposTarget[],
): Promise<DeleteReposResult> {
  const client = await getClientGitHubClient();
  return client.deleteRepos(repos);
}

export type { DeleteReposResult, DeleteReposTarget };
