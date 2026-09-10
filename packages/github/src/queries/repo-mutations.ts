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
 * Fields accepted by `PATCH /repos/{owner}/{repo}` (+ topics endpoint).
 * Booleans/strings are partial — only provided keys are sent.
 */
export type UpdateRepoSettingsInput = {
  name?: string;
  description?: string | null;
  homepage?: string | null;
  topics?: string[];
  visibility?: "public" | "private";
  hasIssues?: boolean;
  hasProjects?: boolean;
  hasWiki?: boolean;
  /** GitHub REST accepts this; may be missing from older Octokit OpenAPI types. */
  hasDiscussions?: boolean;
  isTemplate?: boolean;
  archived?: boolean;
  allowSquashMerge?: boolean;
  allowMergeCommit?: boolean;
  allowRebaseMerge?: boolean;
  allowAutoMerge?: boolean;
  deleteBranchOnMerge?: boolean;
  allowUpdateBranch?: boolean;
  webCommitSignoffRequired?: boolean;
};

export type UpdateRepoSettingsResult = {
  name: string;
  nameWithOwner: string;
  renamed: boolean;
};

/**
 * Updates repository visibility between public and private.
 */
export async function setRepoVisibility(
  this: GitHubClient,
  fullName: string,
  visibility: "public" | "private",
) {
  await this.updateRepoSettings(fullName, { visibility });
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
  await this.updateRepoSettings(fullName, {
    description: input.description,
    homepage: input.homepage,
    topics: input.topics,
  });
}

/**
 * Patches repository settings via REST and optionally replaces topics.
 */
export async function updateRepoSettings(
  this: GitHubClient,
  fullName: string,
  input: UpdateRepoSettingsInput,
): Promise<UpdateRepoSettingsResult> {
  const { owner, repo } = splitRepoFullName(fullName);

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description ?? "";
  if (input.homepage !== undefined) patch.homepage = input.homepage || "";
  if (input.visibility !== undefined) {
    patch.private = input.visibility === "private";
    patch.visibility = input.visibility;
  }
  if (input.hasIssues !== undefined) patch.has_issues = input.hasIssues;
  if (input.hasProjects !== undefined) patch.has_projects = input.hasProjects;
  if (input.hasWiki !== undefined) patch.has_wiki = input.hasWiki;
  if (input.hasDiscussions !== undefined) patch.has_discussions = input.hasDiscussions;
  if (input.isTemplate !== undefined) patch.is_template = input.isTemplate;
  if (input.archived !== undefined) patch.archived = input.archived;
  if (input.allowSquashMerge !== undefined) patch.allow_squash_merge = input.allowSquashMerge;
  if (input.allowMergeCommit !== undefined) patch.allow_merge_commit = input.allowMergeCommit;
  if (input.allowRebaseMerge !== undefined) patch.allow_rebase_merge = input.allowRebaseMerge;
  if (input.allowAutoMerge !== undefined) patch.allow_auto_merge = input.allowAutoMerge;
  if (input.deleteBranchOnMerge !== undefined) {
    patch.delete_branch_on_merge = input.deleteBranchOnMerge;
  }
  if (input.allowUpdateBranch !== undefined) patch.allow_update_branch = input.allowUpdateBranch;
  if (input.webCommitSignoffRequired !== undefined) {
    patch.web_commit_signoff_required = input.webCommitSignoffRequired;
  }

  let nextName = repo;
  let nextFullName = fullName;

  if (Object.keys(patch).length > 0) {
    const { data } = await this.octokit.rest.repos.update({
      owner,
      repo,
      ...patch,
    } as Parameters<GitHubClient["octokit"]["rest"]["repos"]["update"]>[0]);
    nextName = data.name;
    nextFullName = data.full_name;
  }

  if (input.topics !== undefined) {
    await this.octokit.rest.repos.replaceAllTopics({
      owner,
      repo: nextName,
      names: input.topics,
    });
  }

  return {
    name: nextName,
    nameWithOwner: nextFullName,
    renamed: nextName !== repo,
  };
}
