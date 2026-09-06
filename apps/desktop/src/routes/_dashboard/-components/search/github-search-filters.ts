/**
 * Parse / compose GitHub search filter tokens for the advanced filters modal.
 * Free-text keywords stay untouched; structured qualifiers are edited in the UI.
 */

export type TriState = "any" | "yes" | "no";

export type RangeValue = {
  min?: string;
  max?: string;
  exact?: string;
};

export type GithubSearchFilterDraft = {
  keywords: string;
  user: string;
  org: string;
  language: string;
  fork: TriState;
  archived: TriState;
  inName: boolean;
  inDescription: boolean;
  inTopics: boolean;
  inReadme: boolean;
  stars: RangeValue;
  forks: RangeValue;
  size: RangeValue;
  created: RangeValue;
  pushed: RangeValue;
};

export const emptyGithubSearchFilterDraft = {
  keywords: "",
  user: "",
  org: "",
  language: "",
  fork: "any",
  archived: "any",
  inName: false,
  inDescription: false,
  inTopics: false,
  inReadme: false,
  stars: {},
  forks: {},
  size: {},
  created: {},
  pushed: {},
} as const satisfies GithubSearchFilterDraft;

const KNOWN_IN = new Set(["in:name", "in:description", "in:topics", "in:readme"]);
const RANGE_PREFIXES = ["stars:", "forks:", "size:", "created:", "pushed:"] as const;

/**
 * Split a query into tokens, keeping `NOT is:fork`-style pairs together.
 */
export function tokenizeGithubSearch(query: string): string[] {
  return query.match(/NOT\s+\S+|\S+/g) ?? [];
}

function isRangeToken(token: string): boolean {
  return RANGE_PREFIXES.some((prefix) => token.startsWith(prefix));
}

function parseRangeToken(token: string): { field: keyof Pick<GithubSearchFilterDraft, "stars" | "forks" | "size" | "created" | "pushed">; value: string; op: "exact" | "min" | "max" } | null {
  for (const prefix of RANGE_PREFIXES) {
    if (!token.startsWith(prefix)) continue;
    const field = prefix.slice(0, -1) as "stars" | "forks" | "size" | "created" | "pushed";
    const rest = token.slice(prefix.length);
    if (rest.startsWith(">=") || rest.startsWith(">")) {
      return { field, value: rest.replace(/^>=?/, ""), op: "min" };
    }
    if (rest.startsWith("<=") || rest.startsWith("<")) {
      return { field, value: rest.replace(/^<=?/, ""), op: "max" };
    }
    return { field, value: rest, op: "exact" };
  }
  return null;
}

/**
 * Hydrate the filters draft from the current search `q`.
 */
export function parseGithubSearchFilters(query: string): GithubSearchFilterDraft {
  const draft: GithubSearchFilterDraft = {
    ...emptyGithubSearchFilterDraft,
    stars: {},
    forks: {},
    size: {},
    created: {},
    pushed: {},
  };
  const keywords: string[] = [];

  for (const raw of tokenizeGithubSearch(query)) {
    const token = raw.trim();
    if (!token) continue;

    if (token === "is:fork") {
      draft.fork = "yes";
      continue;
    }
    if (token === "NOT is:fork") {
      draft.fork = "no";
      continue;
    }
    if (token === "is:archived") {
      draft.archived = "yes";
      continue;
    }
    if (token === "NOT is:archived") {
      draft.archived = "no";
      continue;
    }
    if (KNOWN_IN.has(token)) {
      if (token === "in:name") draft.inName = true;
      if (token === "in:description") draft.inDescription = true;
      if (token === "in:topics") draft.inTopics = true;
      if (token === "in:readme") draft.inReadme = true;
      continue;
    }
    if (token.startsWith("user:")) {
      draft.user = token.slice("user:".length);
      continue;
    }
    if (token.startsWith("org:")) {
      draft.org = token.slice("org:".length);
      continue;
    }
    if (token.startsWith("language:")) {
      draft.language = token.slice("language:".length);
      continue;
    }
    if (isRangeToken(token)) {
      const parsed = parseRangeToken(token);
      if (parsed) {
        const range = { ...draft[parsed.field] };
        if (parsed.op === "exact") range.exact = parsed.value;
        if (parsed.op === "min") range.min = parsed.value;
        if (parsed.op === "max") range.max = parsed.value;
        draft[parsed.field] = range;
        continue;
      }
    }
    keywords.push(token);
  }

  draft.keywords = keywords.join(" ");
  return draft;
}

function pushRangeTokens(out: string[], prefix: string, range: RangeValue) {
  const exact = range.exact?.trim();
  if (exact) {
    out.push(`${prefix}${exact}`);
    return;
  }
  const min = range.min?.trim();
  const max = range.max?.trim();
  if (min) out.push(`${prefix}>=${min}`);
  if (max) out.push(`${prefix}<=${max}`);
}

/**
 * Build a GitHub `q` string from the filters draft.
 */
export function serializeGithubSearchFilters(draft: GithubSearchFilterDraft): string {
  const tokens: string[] = [];
  const keywords = draft.keywords.trim();
  if (keywords) tokens.push(keywords);

  const user = draft.user.trim();
  if (user) tokens.push(`user:${user}`);
  const org = draft.org.trim();
  if (org) tokens.push(`org:${org}`);
  const language = draft.language.trim();
  if (language) tokens.push(`language:${language}`);

  if (draft.fork === "yes") tokens.push("is:fork");
  if (draft.fork === "no") tokens.push("NOT is:fork");
  if (draft.archived === "yes") tokens.push("is:archived");
  if (draft.archived === "no") tokens.push("NOT is:archived");

  if (draft.inName) tokens.push("in:name");
  if (draft.inDescription) tokens.push("in:description");
  if (draft.inTopics) tokens.push("in:topics");
  if (draft.inReadme) tokens.push("in:readme");

  pushRangeTokens(tokens, "stars:", draft.stars);
  pushRangeTokens(tokens, "forks:", draft.forks);
  pushRangeTokens(tokens, "size:", draft.size);
  pushRangeTokens(tokens, "created:", draft.created);
  pushRangeTokens(tokens, "pushed:", draft.pushed);

  return tokens.join(" ").trim();
}

/** Count structured filters (excludes free-text keywords). */
export function countGithubSearchFilters(draft: GithubSearchFilterDraft): number {
  let count = 0;
  if (draft.user.trim()) count += 1;
  if (draft.org.trim()) count += 1;
  if (draft.language.trim()) count += 1;
  if (draft.fork !== "any") count += 1;
  if (draft.archived !== "any") count += 1;
  if (draft.inName) count += 1;
  if (draft.inDescription) count += 1;
  if (draft.inTopics) count += 1;
  if (draft.inReadme) count += 1;
  for (const range of [draft.stars, draft.forks, draft.size, draft.created, draft.pushed]) {
    if (range.exact?.trim() || range.min?.trim() || range.max?.trim()) count += 1;
  }
  return count;
}

export const POPULAR_GITHUB_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "Dart",
  "Shell",
  "HTML",
  "CSS",
  "Vue",
  "Svelte",
  "Scala",
  "Elixir",
  "Haskell",
  "Lua",
  "R",
  "Zig",
] as const;
