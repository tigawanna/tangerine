import type { GitTreeEntry, GithubRepoSnapshot } from "../types";
import type { GithubRepoNode } from "../queries/repo-list";

export function createRepoNode(
  overrides: Partial<GithubRepoNode> & Pick<GithubRepoNode, "name" | "nameWithOwner">,
): GithubRepoNode {
  return {
    url: `https://github.com/${overrides.nameWithOwner}`,
    openGraphImageUrl: "https://opengraph.githubassets.com/1/repo.png",
    description: null,
    descriptionHTML: "<p>Description</p>",
    homepageUrl: "https://example.com",
    pushedAt: "2026-01-01T00:00:00Z",
    isPrivate: false,
    isFork: false,
    isArchived: false,
    stargazerCount: 0,
    forkCount: 0,
    defaultBranchRef: { name: "main" },
    repositoryTopics: { nodes: [] },
    ...overrides,
  };
}

export function createRepoSnapshot(
  overrides: Partial<GithubRepoSnapshot> & Pick<GithubRepoSnapshot, "nameWithOwner">,
): GithubRepoSnapshot {
  const name = overrides.name ?? overrides.nameWithOwner.split("/")[1] ?? "repo";

  return {
    id: "R_kgDOExample",
    name,
    description: "A sample repository",
    homepageUrl: "https://example.com",
    openGraphImageUrl: "https://opengraph.githubassets.com/1/repo.png",
    topics: ["typescript"],
    defaultBranch: "main",
    ...overrides,
  };
}

/**
 * Encodes UTF-8 text as a GitHub-style base64 content payload.
 */
export function toGithubBase64(text: string) {
  return btoa(text);
}

/**
 * Creates a git tree entry for mocked repository tree responses.
 */
export function createTreeEntry(path: string, type: "blob" | "tree" = "blob"): GitTreeEntry {
  return { path, type };
}
