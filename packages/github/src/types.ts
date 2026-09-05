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
