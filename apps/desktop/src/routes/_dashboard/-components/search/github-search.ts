export const githubSearchTypes = ["REPOSITORY", "USER"] as const;
export type GithubSearchType = (typeof githubSearchTypes)[number];

/** Shared `view-transition-name` for the header trigger ↔ search-page input morph. */
export const GITHUB_SEARCH_VT_NAME = "github-search";
export const GITHUB_SEARCH_VT_TYPE = "search-morph";
export const GITHUB_SEARCH_INPUT_ID = "github-search-input";

export const githubSearchViewTransition = {
  types: [GITHUB_SEARCH_VT_TYPE],
};

export const defaultGithubSearch = {} as const;

export type GithubSearchParams = {
  q?: string;
  type?: GithubSearchType;
};

export type ResolvedGithubSearch = {
  q: string;
  type: GithubSearchType;
};

/**
 * Apply search defaults in app code — not Zod `.default()` — so validateSearch
 * does not rewrite the URL.
 */
export function resolveGithubSearch(search: GithubSearchParams): ResolvedGithubSearch {
  return {
    q: search.q ?? "",
    type: search.type ?? "REPOSITORY",
  };
}

/**
 * Adds or removes `user:{login}` from a GitHub search string.
 */
export function toggleUserScope(query: string, login: string): string {
  const token = `user:${login}`;
  const parts = query.split(/\s+/).filter(Boolean);
  if (parts.includes(token)) {
    return parts.filter((part) => part !== token).join(" ");
  }
  return [...parts, token].join(" ");
}

export function hasUserScope(query: string, login: string): boolean {
  return query.split(/\s+/).includes(`user:${login}`);
}
