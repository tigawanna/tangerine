import { createGitHubClient, RequestError } from "@repo/github";
import { getGithubToken } from "@/lib/github-token.server.ts";
import {
  DEFAULT_REPO_EMBED_LIMIT,
  type RepoEmbedJob,
} from "@/server/elysia/routes/embed/helpers/repo-worker.ts";

export type GetStarredReposInput = {
  login: string;
  /** GraphQL `after` cursor; omit / null for the first page. */
  after?: string | null;
  /** Page size (GitHub max 100). */
  pageSize?: number;
};

export type StarredReposPage = {
  repos: RepoEmbedJob[];
  /** Cursor for the next page; `null` when there is no next page. */
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
};

export type GetStarredReposResult =
  | { data: StarredReposPage; error: null }
  | { data: null; error: "429" };

/**
 * Fetches one page of starred repos for `login`.
 * On GitHub rate limit (HTTP or GraphQL body) → `{ data: null, error: "429" }`.
 */
export async function getStarredRepos(
  input: GetStarredReposInput,
): Promise<GetStarredReposResult> {
  const pageSize = Math.min(input.pageSize ?? DEFAULT_REPO_EMBED_LIMIT, 100);
  const client = createGitHubClient(await getGithubToken());

  try {
    const page = await client.getUserStarredRepos({
      login: input.login,
      first: pageSize,
      after: input.after ?? undefined,
    });

    if (!page) {
      return {
        data: { repos: [], nextCursor: null, hasNextPage: false, totalCount: 0 },
        error: null,
      };
    }

    const repos: RepoEmbedJob[] = page.edges.map(({ node }) => ({
      repoId: node.id,
      owner: node.owner.login,
      name: node.name,
      description: node.description ?? null,
      url: node.url,
      languages: (node.languages?.edges ?? [])
        .map((edge) => edge?.node?.name)
        .filter((name): name is string => Boolean(name)),
    }));

    const hasNextPage = page.pageInfo.hasNextPage;
    const nextCursor = hasNextPage ? page.pageInfo.endCursor : null;

    return {
      data: {
        repos,
        nextCursor,
        hasNextPage,
        totalCount: page.totalCount,
      },
      error: null,
    };
  } catch (caught) {
    if (isRateLimited(caught)) {
      return { data: null, error: "429" };
    }
    throw caught;
  }
}

type GraphqlBodyError = {
  type?: string;
  message?: string;
  extensions?: { code?: string };
};

/**
 * GraphQL often returns HTTP 200 with `errors` in the body. Octokit throws those
 * as an error with `.errors` (or an aggregate message). Rate limits look like
 * `{ type: "RATE_LIMITED", message: "API rate limit exceeded…" }`.
 */
function graphqlBodyErrors(error: unknown): GraphqlBodyError[] {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: unknown }).errors;
    if (Array.isArray(errors)) {
      return errors as GraphqlBodyError[];
    }
  }

  if (
    error instanceof Error &&
    error.message.includes("Request failed due to following response errors")
  ) {
    return error.message
      .split("\n")
      .slice(1)
      .map((line) => ({ message: line.replace(/^\s*-\s*/, "").trim() }))
      .filter((entry) => entry.message.length > 0);
  }

  return [];
}

function looksLikeRateLimitMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("secondary rate") ||
    lower.includes("api rate limit")
  );
}

function isRateLimited(error: unknown): boolean {
  if (error instanceof RequestError) {
    if (error.status === 429) return true;
    if (error.status === 403 && looksLikeRateLimitMessage(error.message)) return true;
  }

  for (const entry of graphqlBodyErrors(error)) {
    const code = (entry.type ?? entry.extensions?.code ?? "").toUpperCase();
    if (code === "RATE_LIMITED" || code === "RATE_LIMIT") return true;
    if (entry.message && looksLikeRateLimitMessage(entry.message)) return true;
  }

  return false;
}
