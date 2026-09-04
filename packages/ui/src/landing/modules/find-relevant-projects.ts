import type { GithubRepoNode } from "../types/github";

export type RelevantProject = {
  name: string;
  nameWithOwner: string;
  description: string | undefined;
  url: string;
  homepageUrl: string;
  tags: string[];
  matchScore: number;
  matchedTags: string[];
};

const MIN_TERM_LENGTH = 2;
const EXACT_TAG_SCORE = 4;
const PARTIAL_TAG_SCORE = 2;
const TEXT_MATCH_SCORE = 1;

function normalizeTerm(term: string) {
  return term.trim().toLowerCase().replace(/\s+/g, "-");
}

export function parseProjectQueryTerms(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const splitTerms = normalized
    .split(/[,\s/|]+/)
    .map(normalizeTerm)
    .filter((term) => term.length >= MIN_TERM_LENGTH);

  return [...new Set(splitTerms)];
}

function getRepoTags(repo: GithubRepoNode) {
  return (repo.repositoryTopics?.nodes ?? []).map((node) => node.topic.name.toLowerCase());
}

function scoreTagMatch(tag: string, term: string) {
  if (tag === term) return EXACT_TAG_SCORE;
  if (tag.includes(term) || term.includes(tag)) return PARTIAL_TAG_SCORE;
  return 0;
}

export function scoreProjectRelevance(
  repo: GithubRepoNode,
  query: string,
): { score: number; matchedTags: string[] } {
  const terms = parseProjectQueryTerms(query);
  if (terms.length === 0) return { score: 0, matchedTags: [] };

  const tags = getRepoTags(repo);
  const haystack = [repo.name, repo.nameWithOwner, repo.description ?? "", ...tags]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const matchedTags = new Set<string>();

  for (const term of terms) {
    let termMatched = false;

    for (const tag of tags) {
      const tagScore = scoreTagMatch(tag, term);
      if (tagScore > 0) {
        score += tagScore;
        matchedTags.add(tag);
        termMatched = true;
      }
    }

    if (!termMatched && haystack.includes(term)) {
      score += TEXT_MATCH_SCORE;
    }
  }

  return { score, matchedTags: [...matchedTags] };
}

export function findRelevantProjects(
  repos: GithubRepoNode[],
  query: string,
  limit = 6,
): RelevantProject[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  return repos
    .map((repo) => {
      const { score, matchedTags } = scoreProjectRelevance(repo, normalizedQuery);

      return {
        name: repo.name,
        nameWithOwner: repo.nameWithOwner,
        description: repo.description,
        url: repo.url,
        homepageUrl: repo.homepageUrl,
        tags: getRepoTags(repo),
        matchScore: score,
        matchedTags,
      };
    })
    .filter((project) => project.matchScore > 0)
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

export function matchesProjectRelevance(repo: GithubRepoNode, query: string) {
  if (!query.trim()) return true;
  return scoreProjectRelevance(repo, query).score > 0;
}

export function orderReposByRelevance(repos: GithubRepoNode[], query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return repos;

  return [...repos].sort((left, right) => {
    const leftScore = scoreProjectRelevance(left, normalizedQuery).score;
    const rightScore = scoreProjectRelevance(right, normalizedQuery).score;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return left.name.localeCompare(right.name);
  });
}
