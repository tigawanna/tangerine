import { createGitHubClient, isGithubRateLimited } from "@repo/github";
import { getGithubToken } from "@/lib/github-token.server.ts";
import {
  DEFAULT_REPO_EMBED_LIMIT,
  type RepoEmbedJob,
} from "@/server/elysia/routes/enrich/starred/helpers/repo-worker.ts";

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
    if (isGithubRateLimited(caught)) {
      return { data: null, error: "429" };
    }
    throw caught;
  }
}
