export { createGitHubClient, GitHubClient, RequestError } from "./client";
export {
  ViewerQuery,
  VIEWER_QUERY,
  type ViewerQueryResult,
} from "./queries/user";
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
