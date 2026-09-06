import { getRepoDetail } from "@/modules/github/repo-detail";
import { queryOptions } from "@tanstack/react-query";

/**
 * Query options for a single repository detail page.
 */
export function repoDetailQueryOptions(owner: string, repo: string) {
  return queryOptions({
    queryKey: ["github", "repo-detail", owner, repo],
    queryFn: () => getRepoDetail({ data: { owner, repo } }),
  });
}
