import type { GithubRepoNode } from "../../../types/github";
import { matchesProjectRelevance } from "../../../modules/find-relevant-projects";

function repoSearchText(repo: GithubRepoNode) {
  const tags = repo.repositoryTopics?.nodes?.map((node) => node.topic.name).join(" ") ?? "";

  return [repo.name, repo.nameWithOwner, repo.description ?? "", tags].join(" ").toLowerCase();
}

export function matchesProjectSearch(repo: GithubRepoNode, query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return true;

  if (matchesProjectRelevance(repo, normalizedQuery)) {
    return true;
  }

  const normalizedQueryLower = normalizedQuery.toLowerCase();
  return repoSearchText(repo).includes(normalizedQueryLower);
}

export function filterReposByTopic(repos: GithubRepoNode[], topic: string) {
  if (topic === "all") return repos;

  const normalizedTopic = topic.toLowerCase();

  return repos.filter((repo) =>
    repo.repositoryTopics?.nodes?.some((node) => node.topic.name.toLowerCase() === normalizedTopic),
  );
}
