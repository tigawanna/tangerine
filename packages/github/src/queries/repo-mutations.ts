import type { GitHubClient } from "../client";
import { splitRepoFullName } from "../utils/repo";

/**
 * Deletes a repository by `owner/repo` full name.
 */
export async function deleteRepo(this: GitHubClient, fullName: string) {
  const { owner, repo } = splitRepoFullName(fullName);
  await this.octokit.rest.repos.delete({ owner, repo });
}

/**
 * Updates repository visibility between public and private.
 */
export async function setRepoVisibility(
  this: GitHubClient,
  fullName: string,
  visibility: "public" | "private",
) {
  const { owner, repo } = splitRepoFullName(fullName);
  await this.octokit.rest.repos.update({
    owner,
    repo,
    private: visibility === "private",
    visibility,
  });
}

/**
 * Updates repository description, homepage, and topics.
 */
export async function applyRepoMetadata(
  this: GitHubClient,
  fullName: string,
  input: {
    description: string;
    homepage?: string | null;
    topics: string[];
  },
) {
  const { owner, repo } = splitRepoFullName(fullName);

  await this.octokit.rest.repos.update({
    owner,
    repo,
    description: input.description,
    homepage: input.homepage || undefined,
  });

  await this.octokit.rest.repos.replaceAllTopics({
    owner,
    repo,
    names: input.topics,
  });
}
