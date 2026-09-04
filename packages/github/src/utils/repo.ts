import type { GithubRepoNode, GithubRepoSnapshot } from "../types";

/**
 * Splits a `owner/repo` full name into its parts.
 *
 * @param fullName - Repository full name (e.g. `octocat/Hello-World`).
 */
export function splitRepoFullName(fullName: string) {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid repository full name");
  }
  return { owner, repo };
}

/**
 * Extracts topic names from a GitHub repository GraphQL node.
 */
export function extractRepoTags(repo: GithubRepoNode) {
  return (repo.repositoryTopics?.nodes ?? [])
    .map((node) => node.topic.name)
    .filter((tag) => tag.length > 0);
}

/**
 * Builds a compact text block for embedding/search from a repository node.
 */
export function buildRepoSearchText(repo: GithubRepoNode) {
  const tags = extractRepoTags(repo);
  const parts = [
    `Repository: ${repo.name}`,
    `Full name: ${repo.nameWithOwner}`,
    repo.description ? `Description: ${repo.description}` : null,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
  ];

  return parts.filter((part): part is string => Boolean(part)).join("\n");
}

/**
 * Returns whether a repository has a custom GitHub social preview image.
 */
export function hasCustomSocialPreview(url: string | null | undefined) {
  return Boolean(url?.includes("repository-images.githubusercontent.com"));
}

/**
 * Returns whether description and topics are both populated on a repo snapshot.
 */
export function isRepoMetadataComplete(repo: Pick<GithubRepoSnapshot, "description" | "topics">) {
  const hasDescription = (repo.description?.trim().length ?? 0) > 0;
  const hasTopics = repo.topics.length > 0;
  return hasDescription && hasTopics;
}

/**
 * Maps an enrichment GraphQL repository node to a compact snapshot.
 */
export function mapEnrichmentRepoNode(node: {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  homepageUrl: string | null;
  openGraphImageUrl: string | null;
  defaultBranchRef: { name: string } | null;
  repositoryTopics: {
    nodes: { topic: { name: string } }[];
  };
}): GithubRepoSnapshot {
  return {
    id: node.id,
    name: node.name,
    nameWithOwner: node.nameWithOwner,
    description: node.description,
    homepageUrl: node.homepageUrl,
    openGraphImageUrl: node.openGraphImageUrl,
    topics: node.repositoryTopics.nodes
      .map((entry) => entry.topic.name)
      .filter((name) => name.length > 0),
    defaultBranch: node.defaultBranchRef?.name ?? "main",
  };
}

/**
 * Filters null repository nodes from a GraphQL list response.
 */
export function filterRepoNodes<T extends { isPrivate?: boolean }>(
  nodes: (T | null | undefined)[],
  options?: { excludePrivate?: boolean },
) {
  const excludePrivate = options?.excludePrivate ?? false;
  return nodes.filter((node): node is T => {
    if (node == null) {
      return false;
    }
    if (excludePrivate && node.isPrivate) {
      return false;
    }
    return true;
  });
}
