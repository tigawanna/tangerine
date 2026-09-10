import {
  RECENT_REPOS_QUERY,
  type FetchRecentReposOptions,
  type FetchRecentReposResult,
  type RecentReposQueryResult,
} from "@repo/github/queries/repo-list";
import type { GithubGraphqlError } from "@repo/github";
import { getGithubToken } from "@/lib/github-token.server";

type RecentReposGraphqlBody = {
  data?: RecentReposQueryResult;
  errors?: GithubGraphqlError[];
};

/**
 * Fetches recent viewer repositories via raw GitHub GraphQL `fetch`.
 *
 * Unlike Octokit, GraphQL field errors (e.g. org PAT policy blocks on individual
 * repos) are returned in `errors` while still exposing partial `data`.
 */
export async function fetchRecentReposGraphql(
  options: FetchRecentReposOptions = {},
): Promise<FetchRecentReposResult> {
  const pat = await getGithubToken();

  const {
    first = 100,
    firstTopics = 10,
    isFork = false,
    orderField = "PUSHED_AT",
    orderDirection = "DESC",
    cache = "no-store",
  } = options;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pat}`,
    },
    cache,
    body: JSON.stringify({
      query: RECENT_REPOS_QUERY,
      variables: { first, firstTopics, isFork, orderField, orderDirection },
    }),
  });

  if (!res.ok) {
    return {
      data: null,
      errors: [
        {
          message: res.statusText,
          path: [],
          extensions: { code: "HTTP_ERROR", typeName: "", fieldName: "" },
          locations: [],
        },
      ],
      rateLimit: null,
    };
  }

  const body = (await res.json()) as RecentReposGraphqlBody;
  const nodes = (body.data?.viewer.repositories.nodes ?? []).filter(
    (node): node is NonNullable<typeof node> => node != null,
  );

  return {
    data: body.data
      ? {
          viewer: {
            pinnedItems: { nodes: [] },
            repositories: { nodes },
          },
        }
      : null,
    errors: body.errors ?? [],
    rateLimit: body.data?.rateLimit ?? null,
  };
}
