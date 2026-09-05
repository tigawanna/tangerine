import { getGithubViewer } from "@/modules/github/viewer";
import { queryOptions } from "@tanstack/react-query";

/**
 * Typed GitHub GraphQL viewer for the dashboard home (`/viewer`).
 */
export const githubViewerQueryOptions = queryOptions({
  queryKey: ["github", "viewer"],
  queryFn: () => getGithubViewer(),
});
