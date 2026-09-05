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
  failed: Array<{ repo: string; issue: string }>;
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
            issue: describeDeleteError(error),
          });
        }
      }),
    );

    return { successful, failed };
  });

/**
 * Maps Octokit / unknown errors into a short toast-friendly message.
 */
function describeDeleteError(error: unknown): string {
  if (error instanceof RequestError) {
    if (error.status === 403) {
      return "Forbidden — needs delete_repo scope or admin access. Sign out and back in.";
    }
    if (error.status === 404) {
      return "Not found or no access";
    }
    return error.message || `HTTP ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}
