export type {
  FetchRecentReposOptions,
  FetchRecentReposResult,
  GithubGraphqlError as RequestError,
  GithubRepoDetail,
  GithubRepoNode,
  GithubRepoSnapshot,
  PinnedViewerReposResponse,
  RepositoryTopic,
  ViewerPinnedRepo,
  ViewerPinnedRepoData,
  ViewerPinnedRepoError,
} from "@repo/github";

import type { GithubRepoDetail } from "@repo/github";

/** GraphQL response wrapper for a single repository detail query. */
export interface OneRepoGQL {
  data: { repository: GithubRepoDetail };
}
