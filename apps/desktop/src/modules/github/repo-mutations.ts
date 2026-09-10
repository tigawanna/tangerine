import { getClientGitHubClient } from "@/lib/github/client";
import type {
  DeleteReposResult,
  DeleteReposTarget,
  UpdateRepoSettingsInput,
  UpdateRepoSettingsResult,
} from "@repo/github";

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

/**
 * Patches repository About + settings knobs via GitHub REST.
 */
export async function updateGithubRepoSettings(
  fullName: string,
  input: UpdateRepoSettingsInput,
): Promise<UpdateRepoSettingsResult> {
  const client = await getClientGitHubClient();
  return client.updateRepoSettings(fullName, input);
}

export type {
  DeleteReposResult,
  DeleteReposTarget,
  UpdateRepoSettingsInput,
  UpdateRepoSettingsResult,
};
