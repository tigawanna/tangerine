import { RequestError } from "octokit";
import type { GitHubClient } from "../client";
import { splitRepoFullName } from "../utils/repo";

export type DeleteReposTarget = {
  id: string;
  nameWithOwner: string;
};

export type DeleteReposFailureCode =
  | "missing_delete_repo_scope"
  | "forbidden"
  | "not_found"
  | "unknown";

export type DeleteReposResult = {
  successful: Array<{ id: string; name: string }>;
  failed: Array<{ repo: string; issue: string; code: DeleteReposFailureCode }>;
  /** True when at least one failure looks like a missing `delete_repo` OAuth scope. */
  needsDeleteRepoScope: boolean;
};

/**
 * Deletes a repository by `owner/repo` full name.
 */
export async function deleteRepo(this: GitHubClient, fullName: string) {
  const { owner, repo } = splitRepoFullName(fullName);
  await this.octokit.rest.repos.delete({ owner, repo });
}

/**
 * Deletes many repositories; collects per-repo successes/failures.
 * Requires the GitHub `delete_repo` OAuth scope.
 */
export async function deleteRepos(
  this: GitHubClient,
  repos: readonly DeleteReposTarget[],
): Promise<DeleteReposResult> {
  const successful: DeleteReposResult["successful"] = [];
  const failed: DeleteReposResult["failed"] = [];

  await Promise.all(
    repos.map(async (repo) => {
      try {
        await this.deleteRepo(repo.nameWithOwner);
        successful.push({ id: repo.id, name: repo.nameWithOwner });
      } catch (error: unknown) {
        failed.push({
          repo: repo.nameWithOwner,
          ...describeDeleteFailure(error),
        });
      }
    }),
  );

  return {
    successful,
    failed,
    needsDeleteRepoScope: failed.some((item) => item.code === "missing_delete_repo_scope"),
  };
}

/**
 * Maps Octokit / unknown errors into a toast-friendly issue + machine-readable code.
 */
function describeDeleteFailure(error: unknown): {
  issue: string;
  code: DeleteReposFailureCode;
} {
  if (error instanceof RequestError) {
    if (error.status === 403) {
      // List UI only selects ADMIN repos, so 403 here is almost always a missing
      // `delete_repo` OAuth scope on an older session.
      return {
        code: "missing_delete_repo_scope",
        issue: "Missing delete_repo scope — sign in again to grant it.",
      };
    }
    if (error.status === 404) {
      return { code: "not_found", issue: "Not found or no access" };
    }
    return { code: "unknown", issue: error.message || `HTTP ${error.status}` };
  }
  if (error instanceof Error) {
    return { code: "unknown", issue: error.message };
  }
  return { code: "unknown", issue: "Unknown error" };
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
