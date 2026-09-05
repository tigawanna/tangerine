import { getGithubViewer } from "@/modules/github/viewer";
import { queryOptions } from "@tanstack/react-query";

/**
 * Typed GitHub GraphQL viewer probe. Wired for gql.tada setup validation —
 * not mounted on a route yet.
 */
export const githubViewerQueryOptions = queryOptions({
  queryKey: ["github", "viewer"],
  queryFn: () => getGithubViewer(),
});
