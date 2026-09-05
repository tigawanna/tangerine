import { createGitHubClient } from "@repo/github";
import { getGithubToken } from "@/lib/github-token.server";
import { createServerFn } from "@tanstack/react-start";

/**
 * Fetches the authenticated GitHub GraphQL viewer via the typed probe query.
 */
export async function fetchGithubViewer() {
  return createGitHubClient(await getGithubToken()).getViewer();
}

export const getGithubViewer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return { data: await fetchGithubViewer(), error: null };
  } catch (error: unknown) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Failed to fetch GitHub viewer",
    };
  }
});
