import { getClientGitHubClient } from "@/lib/github/client";
import { queryOptions } from "@tanstack/react-query";

/**
 * Query options for a repository README (GitHub REST, browser → api.github.com).
 */
export function repoReadmeQueryOptions(owner: string, repo: string) {
  return queryOptions({
    queryKey: ["github", "repo-readme", owner, repo],
    queryFn: async () => {
      const client = await getClientGitHubClient();
      const readme = await client.getRepoReadme(owner, repo);
      return {
        content: readme?.content ?? null,
        path: readme?.path ?? null,
      };
    },
  });
}
