export type RepositoryTopic = {
  topic: {
    name: string;
  };
};

/** GitHub GraphQL `rateLimit` object returned alongside query data. */
export type GithubGraphqlRateLimit = {
  cost: number;
  limit: number;
  remaining: number;
  used: number;
  resetAt: string;
};

export type GithubGraphqlError = {
  path: string[];
  extensions: {
    code: string;
    typeName: string;
    fieldName: string;
  };
  locations: { line: number; column: number }[];
  message: string;
};

/** Repository node returned by viewer pinned/recent GraphQL queries. */
export type GithubRepoNode = {
  name: string;
  url: string;
  openGraphImageUrl: string;
  description?: string;
  descriptionHTML: string;
  homepageUrl: string;
  nameWithOwner: string;
  pushedAt: string;
  isPrivate: boolean;
  isFork?: boolean;
  isArchived?: boolean;
  stargazerCount?: number;
  forkCount?: number;
  /** Default branch name when returned by GraphQL (`defaultBranchRef.name`). */
  defaultBranchRef?: { name: string } | null;
  repositoryTopics: {
    nodes: RepositoryTopic[];
  };
};

export type ViewerPinnedRepoData = {
  viewer: {
    pinnedItems: { nodes: GithubRepoNode[] };
    repositories: { nodes: GithubRepoNode[] };
  };
};

export type ViewerPinnedRepo = {
  data: ViewerPinnedRepoData;
};

export type ViewerPinnedRepoError = {
  errors: GithubGraphqlError[];
};

export type PinnedViewerReposResponse = ViewerPinnedRepo | ViewerPinnedRepoError;

export type GithubRepoDetail = {
  createdAt: string;
  forkCount: number;
  id: string;
  homepageUrl: string;
  isPrivate: boolean;
  description: string;
  isFork: boolean;
  isEmpty: boolean;
  isTemplate: boolean;
  repositoryTopics: {
    edges: {
      node: {
        topic: { name: string };
      };
    }[];
  };
  name: string;
  nameWithOwner: string;
  openGraphImageUrl: string;
  updatedAt: string;
  url: string;
  languages: {
    edges: {
      size: number;
      node: { color: string; name: string };
    }[];
    totalSize: number;
  };
};

export type GithubRepoOrderField =
  | "CREATED_AT"
  | "UPDATED_AT"
  | "PUSHED_AT"
  | "NAME"
  | "STARGAZERS";

export type GithubOrderDirection = "ASC" | "DESC";

export type FetchRecentReposOptions = {
  first?: number;
  isFork?: boolean;
  orderField?: GithubRepoOrderField;
  orderDirection?: GithubOrderDirection;
  cache?: RequestCache;
};

export type FetchRecentReposResult = {
  data: ViewerPinnedRepoData | null;
  errors: GithubGraphqlError[];
  rateLimit: GithubGraphqlRateLimit | null;
};

/** Compact repository snapshot used by enrichment and embedding pipelines. */
export type GithubRepoSnapshot = {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  homepageUrl: string | null;
  openGraphImageUrl: string | null;
  topics: string[];
  defaultBranch: string;
};

export type PackageJsonChunk = {
  path: string;
  content: Record<string, unknown>;
};

export type RepoExtraction = {
  filePaths: string[];
  readme: string | null;
  readmePath: string | null;
  packageJsonChunks: PackageJsonChunk[];
};

export type RepoAnalysis = {
  filePaths: string[];
  packageJson: Record<string, unknown> | null;
};

/** Minimal git tree entry shape used by repository extraction. */
export type GitTreeEntry = {
  path: string;
  type: string;
};
