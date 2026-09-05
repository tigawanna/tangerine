import { Octokit, RequestError } from "octokit";
import type { GithubGraphqlError } from "./types";
import { getViewer } from "./queries/user";
import {
  getPinnedRepos,
  getRecentRepos,
  getRecentReposForIndexing,
  getRecentRepoSnapshots,
} from "./queries/repo-list";
import { getRepoDetail, getRepoSnapshotsByFullNames } from "./queries/repo-info";
import { getRepoFileContent, getRepoTree } from "./queries/repo-contents";
import { applyRepoMetadata, deleteRepo, setRepoVisibility } from "./queries/repo-mutations";

type GraphqlResult<T> = T & {
  errors?: GithubGraphqlError[];
};

type GraphqlRequestOptions = {
  cache?: RequestCache;
  variables?: Record<string, unknown>;
};

/**
 * Creates a GitHub API client backed by Octokit (REST + GraphQL).
 */
export function createGitHubClient(token: string) {
  return new GitHubClient(token);
}

/**
 * Centralized GitHub API client for REST and GraphQL operations.
 *
 * Domain methods live in `./queries/*` and are attached here so callers keep
 * a single `client.getXxx()` surface.
 */
export class GitHubClient {
  readonly octokit: Octokit;
  readonly token: string;

  constructor(token: string) {
    this.token = token;
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Runs a typed GitHub GraphQL query.
   */
  async graphql<T>(query: string, options: GraphqlRequestOptions = {}): Promise<GraphqlResult<T>> {
    const { cache, variables } = options;
    return this.octokit.graphql<GraphqlResult<T>>(query, {
      ...variables,
      request: cache ? { cache } : undefined,
    });
  }

  getViewer = getViewer;
  getPinnedRepos = getPinnedRepos;
  getRecentRepos = getRecentRepos;
  getRecentReposForIndexing = getRecentReposForIndexing;
  getRecentRepoSnapshots = getRecentRepoSnapshots;
  getRepoDetail = getRepoDetail;
  getRepoSnapshotsByFullNames = getRepoSnapshotsByFullNames;
  getRepoTree = getRepoTree;
  getRepoFileContent = getRepoFileContent;
  deleteRepo = deleteRepo;
  setRepoVisibility = setRepoVisibility;
  applyRepoMetadata = applyRepoMetadata;
}

export { RequestError };
