import { getPinnedRepos, getRecentRepos } from "@/modules/github/repos";
import { queryOptions } from "@tanstack/react-query";

export const pinnedReposQueryOptions = queryOptions({
  queryKey: ["github", "pinned-repos"],
  queryFn: () => getPinnedRepos(),
});

export const recentReposQueryOptions = queryOptions({
  queryKey: ["github", "recent-repos"],
  queryFn: () => getRecentRepos(),
});
