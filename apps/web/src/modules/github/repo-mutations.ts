import { getGithubToken } from "@/lib/github-token.server";
import { createGitHubClient, RequestError } from "@repo/github";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const deleteReposInput = z.object({
  repos: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        nameWithOwner: z.string().min(1),
      }),
    )
    .min(1)
    .max(50),
});

export type DeleteReposResult = {
  successful: Array<{ id: string; name: string }>;
  failed: Array<{ repo: string; issue: string; code?: "missing_delete_repo_scope" | "forbidden" | "not_found" | "unknown" }>;
  /** True when at least one failure looks like a missing `delete_repo` OAuth scope. */
  needsDeleteRepoScope: boolean;
};

/**
 * Deletes one or more repositories the signed-in user can administer.
 * Requires the GitHub `delete_repo` OAuth scope.
 */
export const deleteGithubRepos = createServerFn({ method: "POST" })
  .inputValidator(deleteReposInput)
  .handler(async ({ data }): Promise<DeleteReposResult> => {
    const client = createGitHubClient(await getGithubToken());
    const successful: DeleteReposResult["successful"] = [];
    const failed: DeleteReposResult["failed"] = [];

    await Promise.all(
      data.repos.map(async (repo) => {
        try {
          await client.deleteRepo(repo.nameWithOwner);
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
  });

/**
 * Maps Octokit / unknown errors into a toast-friendly issue + machine-readable code.
 */
function describeDeleteFailure(error: unknown): {
  issue: string;
  code: NonNullable<DeleteReposResult["failed"][number]["code"]>;
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
