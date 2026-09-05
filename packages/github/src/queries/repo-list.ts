import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, type ResultOf, type VariablesOf } from "../graphql";
import type { GithubGraphqlError } from "../types";
import { filterRepoNodes, mapEnrichmentRepoNode } from "../utils/repo";

export const RecentReposQuery = graphql(`
  query getViewerRecentlyPushedRepos(
    $first: Int!
    $isFork: Boolean
    $orderField: RepositoryOrderField!
    $orderDirection: OrderDirection!
    $firstTopics: Int!
  ) {
    viewer {
      repositories(
        orderBy: { field: $orderField, direction: $orderDirection }
        first: $first
        isFork: $isFork
      ) {
        nodes {
          name
          url
          openGraphImageUrl
          description
          descriptionHTML
          homepageUrl
          nameWithOwner
          pushedAt
          isPrivate
          isFork
          isArchived
          stargazerCount
          forkCount
          diskUsage
          defaultBranchRef {
            name
          }
          owner {
            login
            avatarUrl
            url
          }
          primaryLanguage {
            id
            name
            color
          }
          languages(first: 3) {
            nodes {
              id
              name
              color
            }
          }
          repositoryTopics(first: $firstTopics) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
    rateLimit {
      cost
      limit
      remaining
      used
      resetAt
    }
  }
`);

export const PinnedReposQuery = graphql(`
  query getViewerPinnedRepos {
    viewer {
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          __typename
          ... on Repository {
            name
            url
            openGraphImageUrl
            description
            descriptionHTML
            homepageUrl
            nameWithOwner
            pushedAt
            isPrivate
            isFork
            isArchived
            stargazerCount
            forkCount
            diskUsage
            defaultBranchRef {
              name
            }
            owner {
              login
              avatarUrl
              url
            }
            primaryLanguage {
              id
              name
              color
            }
            languages(first: 3) {
              nodes {
                id
                name
                color
              }
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`);

export const EnrichmentRecentReposQuery = graphql(`
  query getViewerRecentlyPushedRepos($first: Int!) {
    viewer {
      repositories(orderBy: { field: PUSHED_AT, direction: DESC }, first: $first, isFork: false) {
        nodes {
          id
          name
          nameWithOwner
          description
          descriptionHTML
          homepageUrl
          openGraphImageUrl
          isPrivate
          defaultBranchRef {
            name
          }
          repositoryTopics(first: 20) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
  }
`);

export type RecentReposQueryResult = ResultOf<typeof RecentReposQuery>;
export type PinnedReposQueryResult = ResultOf<typeof PinnedReposQuery>;
export type EnrichmentRecentReposQueryResult = ResultOf<typeof EnrichmentRecentReposQuery>;

/** Repository node from viewer recent/pinned list queries. */
export type GithubRepoNode = NonNullable<
  NonNullable<RecentReposQueryResult["viewer"]["repositories"]["nodes"]>[number]
>;

export type RepositoryTopic = NonNullable<
  NonNullable<GithubRepoNode["repositoryTopics"]["nodes"]>[number]
>;

export type GithubGraphqlRateLimit = NonNullable<RecentReposQueryResult["rateLimit"]>;

export type GithubRepoOrderField = VariablesOf<typeof RecentReposQuery>["orderField"];
export type GithubOrderDirection = VariablesOf<typeof RecentReposQuery>["orderDirection"];

export type ViewerPinnedRepoData = {
  viewer: {
    pinnedItems: { nodes: GithubRepoNode[] };
    repositories: { nodes: GithubRepoNode[] };
  };
};

export type ViewerPinnedRepo = {
  data: ViewerPinnedRepoData;
};

export type ViewerPinnedRepoError = {
  errors: GithubGraphqlError[];
};

export type PinnedViewerReposResponse = ViewerPinnedRepo | ViewerPinnedRepoError;

export type FetchRecentReposOptions = {
  first?: number;
  firstTopics?: number;
  isFork?: boolean;
  orderField?: GithubRepoOrderField;
  orderDirection?: GithubOrderDirection;
  cache?: RequestCache;
};

export type FetchRecentReposResult = {
  data: ViewerPinnedRepoData | null;
  errors: GithubGraphqlError[];
  rateLimit: GithubGraphqlRateLimit | null;
};

export const RECENT_REPOS_QUERY = print(RecentReposQuery);
export const PINNED_REPOS_QUERY = print(PinnedReposQuery);
export const ENRICHMENT_RECENT_REPOS_QUERY = print(EnrichmentRecentReposQuery);

/** Narrows pinnedItems' Gist|Repository union to the Repository branch after a __typename guard. */
type PinnedRepoNode = Extract<
  NonNullable<
    NonNullable<PinnedReposQueryResult["viewer"]["pinnedItems"]["nodes"]>[number]
  >,
  { __typename: "Repository" }
>;

/**
 * Fetches the viewer's pinned public repositories.
 */
export async function getPinnedRepos(this: GitHubClient) {
  const result = await this.graphql<PinnedReposQueryResult>(PINNED_REPOS_QUERY);
  const nodes = (result.viewer.pinnedItems.nodes ?? []).filter(
    (node): node is PinnedRepoNode => node?.__typename === "Repository",
  );
  return filterRepoNodes(nodes, { excludePrivate: true });
}

/**
 * Fetches the viewer's recent public repositories with optional sort and cache controls.
 *
 * Uses raw GraphQL `fetch` (not Octokit) so org PAT policy errors on individual
 * repos still return partial `data.viewer.repositories.nodes`.
 */
export async function getRecentRepos(
  this: GitHubClient,
  options: FetchRecentReposOptions = {},
): Promise<FetchRecentReposResult> {
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
      Authorization: `Bearer ${this.token}`,
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
          message: res.statusText || `GitHub GraphQL HTTP ${res.status}`,
          path: [],
          extensions: { code: "HTTP_ERROR", typeName: "", fieldName: "" },
          locations: [],
        },
      ],
      rateLimit: null,
    };
  }

  const body = (await res.json()) as {
    data?: RecentReposQueryResult;
    errors?: GithubGraphqlError[];
  };

  const nodes = filterRepoNodes(body.data?.viewer.repositories.nodes ?? [], {
    excludePrivate: true,
  });

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

/**
 * Fetches recent public repositories for indexing.
 */
export async function getRecentReposForIndexing(this: GitHubClient) {
  const result = await this.graphql<RecentReposQueryResult>(RECENT_REPOS_QUERY, {
    variables: {
      first: 100,
      firstTopics: 10,
      isFork: false,
      orderField: "PUSHED_AT",
      orderDirection: "DESC",
    },
  });

  return filterRepoNodes(result.viewer.repositories.nodes ?? [], { excludePrivate: true });
}

/**
 * Fetches recent repositories for enrichment workflows.
 */
export async function getRecentRepoSnapshots(this: GitHubClient, limit: number) {
  const result = await this.graphql<EnrichmentRecentReposQueryResult>(
    ENRICHMENT_RECENT_REPOS_QUERY,
    { variables: { first: limit } },
  );

  return filterRepoNodes(result.viewer.repositories.nodes ?? [], { excludePrivate: true }).map(
    (node) =>
      mapEnrichmentRepoNode({
        ...node,
        repositoryTopics: {
          nodes: (node.repositoryTopics.nodes ?? []).filter(
            (entry): entry is { topic: { name: string } } => entry != null,
          ),
        },
      }),
  );
}
