export { createGitHubClient, GitHubClient, RequestError } from "./client";
export {
  ViewerQuery,
  UserProfileQuery,
  VIEWER_QUERY,
  USER_PROFILE_QUERY,
  type ViewerQueryResult,
  type UserProfileQueryResult,
} from "./queries/user";
export { UserCardFragment } from "./queries/fragments/user-card";
export { RepoCardFragment } from "./queries/fragments/repo-card";
export { RepoGeneralInfoFragment } from "./queries/fragments/repo-general-info";
export {
  SearchRepoFragment,
  SearchUserFragment,
} from "./queries/fragments/search-results";
export {
  RecentReposQuery,
  PinnedReposQuery,
  EnrichmentRecentReposQuery,
  RECENT_REPOS_QUERY,
  PINNED_REPOS_QUERY,
  ENRICHMENT_RECENT_REPOS_QUERY,
  type RecentReposQueryResult,
  type PinnedReposQueryResult,
  type EnrichmentRecentReposQueryResult,
  type GithubRepoNode,
  type RepositoryTopic,
  type GithubGraphqlRateLimit,
  type GithubRepoOrderField,
  type GithubOrderDirection,
  type ViewerPinnedRepoData,
  type ViewerPinnedRepo,
  type ViewerPinnedRepoError,
  type PinnedViewerReposResponse,
  type FetchRecentReposOptions,
  type FetchRecentReposResult,
} from "./queries/repo-list";
export {
  OneRepoQuery,
  RepoByNameQuery,
  ONE_REPO_QUERY,
  REPO_BY_NAME_QUERY,
  type OneRepoQueryResult,
  type RepoByNameQueryResult,
  type GithubRepoDetail,
} from "./queries/repo-info";
export {
  RepoPageQuery,
  RepoLanguagesQuery,
  RepoStargazersQuery,
  REPO_PAGE_QUERY,
  REPO_LANGUAGES_QUERY,
  REPO_STARGAZERS_QUERY,
  type RepoPageQueryResult,
  type RepoPageVariables,
  type RepoLanguagesQueryResult,
  type RepoStargazersQueryResult,
} from "./queries/repo-page";
export {
  UserReposQuery,
  USER_REPOS_QUERY,
  type UserReposQueryResult,
  type UserReposVariables,
} from "./queries/user-repos";
export {
  UserStarredReposQuery,
  USER_STARRED_REPOS_QUERY,
  type UserStarredReposQueryResult,
  type UserStarredReposVariables,
} from "./queries/user-starred";
export {
  UserFollowersQuery,
  UserFollowingQuery,
  USER_FOLLOWERS_QUERY,
  USER_FOLLOWING_QUERY,
  type UserFollowersQueryResult,
  type UserFollowingQueryResult,
} from "./queries/user-social";
export {
  SearchQuery,
  SEARCH_QUERY,
  type SearchQueryResult,
  type SearchVariables,
} from "./queries/search";
export {
  FollowUserMutation,
  UnfollowUserMutation,
  FOLLOW_USER_MUTATION,
  UNFOLLOW_USER_MUTATION,
} from "./queries/user-mutations";
export {
  AddStarMutation,
  RemoveStarMutation,
  ADD_STAR_MUTATION,
  REMOVE_STAR_MUTATION,
} from "./queries/repo-mutations";
export { graphql, readFragment } from "./graphql";
export type { FragmentOf, ResultOf, VariablesOf } from "./graphql";
export {
  fetchRepoAnalysis,
  fetchRepoExtraction,
  getRootPackageJson,
  getWorkspacePackageChunks,
  isMonorepoExtraction,
  readmeHasDescription,
  readmeHasTags,
  summarizePackageJson,
} from "./extraction";
export {
  CURRENT_COLLECTOR_VERSION,
  classifyPackageDir,
  collectArtifacts,
  detectMonorepoKind,
  discoverManifestCandidates,
  findReadmeInDir,
  findReadmePath,
  isWorkspacePackageJson,
  listPackageUnitDirs,
  MONOREPO_PACKAGE_ROOTS,
  packageUnitName,
  parseManifest,
  parsePackageJson,
  repoArtifactLanguages,
} from "./spelunk/index";
export type {
  ManifestCandidate,
  MonorepoDetection,
  MonorepoKind,
  RepoArtifact,
  RepoArtifactLanguage,
  RepoPackageUnit,
  SpelunkPayload,
} from "./spelunk/index";
export type {
  GithubGraphqlError,
  GithubRepoSnapshot,
  PackageJsonChunk,
  RepoAnalysis,
  RepoExtraction,
  GitTreeEntry,
} from "./types";
export {
  buildRepoSearchText,
  extractRepoTags,
  filterRepoNodes,
  hasCustomSocialPreview,
  isRepoMetadataComplete,
  mapEnrichmentRepoNode,
  splitRepoFullName,
} from "./utils/repo";
