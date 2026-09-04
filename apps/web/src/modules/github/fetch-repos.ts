import {
  buildRepoSearchText,
  createGitHubClient,
  extractRepoTags,
  type FetchRecentReposOptions,
  type GithubRepoNode,
} from "@repo/github";
import { fetchRecentReposGraphql } from "@/modules/github/gql-queries";
import { getGithubToken } from "@/lib/github-token.server";

export type {
  FetchRecentReposOptions,
  GithubRepoOrderField,
  GithubOrderDirection,
} from "@repo/github";

/**
 * Fetches the viewer's pinned GitHub repositories.
 */
export async function fetchPinnedReposFromGithub() {
  return createGitHubClient(await getGithubToken()).getPinnedRepos();
}

/**
 * Fetches the viewer's recent GitHub repositories via GraphQL.
 */
export async function fetchRecentReposFromGithub(options: FetchRecentReposOptions = {}) {
  return fetchRecentReposGraphql(options);
}

export { buildRepoSearchText, extractRepoTags };
export type { GithubRepoNode };
