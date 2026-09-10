import { getPinnedRepos, getRecentRepos } from "@/modules/github/repos";
import { queryOptions } from "@tanstack/react-query";

export const pinnedReposQueryOptions = queryOptions({
  queryKey: ["github", "pinned-repos"],
  queryFn: () => getPinnedRepos(),
});

/**
 * Recent viewer repos. Pass `isFork: true|false` to filter, or omit for all.
 */
export function recentReposQueryOptions(isFork?: boolean | null) {
  return queryOptions({
    queryKey: ["github", "recent-repos", { isFork: isFork ?? null }],
    queryFn: () => getRecentRepos({ data: { isFork: isFork ?? null } }),
  });
}
