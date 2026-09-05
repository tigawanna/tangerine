import { Octokit, RequestError } from "octokit";
import type { GithubGraphqlError } from "./types";
import { getUserProfile, getViewer } from "./queries/user";
import { getUserFollowers, getUserFollowing } from "./queries/user-social";
import { getUserRepos } from "./queries/user-repos";
import { getUserStarredRepos } from "./queries/user-starred";
import { followUser, unfollowUser } from "./queries/user-mutations";
import { searchGithub } from "./queries/search";
import {
  getPinnedRepos,
  getRecentRepos,
  getRecentReposForIndexing,
  getRecentRepoSnapshots,
} from "./queries/repo-list";
import { getRepoDetail, getRepoSnapshotsByFullNames } from "./queries/repo-info";
import {
  getRepoLanguages,
  getRepoPage,
  getRepoStargazers,
} from "./queries/repo-page";
import { getRepoFileContent, getRepoReadme, getRepoTree } from "./queries/repo-contents";
import {
  addStar,
  applyRepoMetadata,
  deleteRepo,
  removeStar,
  setRepoVisibility,
} from "./queries/repo-mutations";

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
  getUserProfile = getUserProfile;
  getUserFollowers = getUserFollowers;
  getUserFollowing = getUserFollowing;
  getUserRepos = getUserRepos;
  getUserStarredRepos = getUserStarredRepos;
  followUser = followUser;
  unfollowUser = unfollowUser;
  searchGithub = searchGithub;
  getPinnedRepos = getPinnedRepos;
  getRecentRepos = getRecentRepos;
  getRecentReposForIndexing = getRecentReposForIndexing;
  getRecentRepoSnapshots = getRecentRepoSnapshots;
  getRepoDetail = getRepoDetail;
  getRepoSnapshotsByFullNames = getRepoSnapshotsByFullNames;
  getRepoPage = getRepoPage;
  getRepoLanguages = getRepoLanguages;
  getRepoStargazers = getRepoStargazers;
  getRepoTree = getRepoTree;
  getRepoFileContent = getRepoFileContent;
  getRepoReadme = getRepoReadme;
  deleteRepo = deleteRepo;
  setRepoVisibility = setRepoVisibility;
  applyRepoMetadata = applyRepoMetadata;
  addStar = addStar;
  removeStar = removeStar;
}

export { RequestError };
