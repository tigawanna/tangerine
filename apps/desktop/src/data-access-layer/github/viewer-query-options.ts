import { getClientGitHubClient } from "@/lib/github/client";
import { queryOptions } from "@tanstack/react-query";

/**
 * Typed GitHub GraphQL viewer for the signed-in user (browser → GitHub).
 */
export const githubViewerQueryOptions = queryOptions({
  queryKey: ["github", "viewer"],
  queryFn: async () => {
    try {
      const client = await getClientGitHubClient();
      return { data: await client.getViewer(), error: null as string | null };
    } catch (error: unknown) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Failed to fetch GitHub viewer",
      };
    }
  },
});
