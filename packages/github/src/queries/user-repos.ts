import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf, type VariablesOf } from "../graphql";
import { RepoCardFragment } from "./fragments/repo-card";
import { mapRepoMinimal, RepoMinimalFragment, type RepoMinimal } from "./fragments/repo-minimal";

/**
 * Paginated repositories for a user (Relay `UserRepos_repositories` → query).
 */
export const UserReposQuery = graphql(
  `
    query UserRepos(
      $login: String!
      $first: Int = 24
      $after: String
      $orderBy: RepositoryOrder = { field: PUSHED_AT, direction: DESC }
      $isFork: Boolean = false
    ) {
      user(login: $login) {
        repositories(first: $first, after: $after, orderBy: $orderBy, isFork: $isFork) {
          totalCount
          edges {
            cursor
            node {
              ...RepoCard
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  `,
  [RepoCardFragment],
);

/**
 * Lean paginated user repositories (name / owner / description / site / tags only).
 */
export const UserReposMinimalQuery = graphql(
  `
    query UserReposMinimal(
      $login: String!
      $first: Int = 24
      $after: String
      $orderBy: RepositoryOrder = { field: PUSHED_AT, direction: DESC }
      $isFork: Boolean = false
    ) {
      user(login: $login) {
        repositories(first: $first, after: $after, orderBy: $orderBy, isFork: $isFork) {
          totalCount
          edges {
            cursor
            node {
              ...RepoMinimal
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  `,
  [RepoMinimalFragment],
);

export type UserReposQueryResult = ResultOf<typeof UserReposQuery>;
export type UserReposVariables = VariablesOf<typeof UserReposQuery>;
export type UserReposMinimalQueryResult = ResultOf<typeof UserReposMinimalQuery>;
export type UserReposMinimalVariables = VariablesOf<typeof UserReposMinimalQuery>;

export const USER_REPOS_QUERY = print(UserReposQuery);
export const USER_REPOS_MINIMAL_QUERY = print(UserReposMinimalQuery);

export type UserReposMinimalPage = {
  totalCount: number;
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
  };
  edges: Array<{ cursor: string; node: RepoMinimal }>;
};

/**
 * Fetches a page of repositories owned by a user (full RepoCard payload).
 */
export async function getUserRepos(this: GitHubClient, variables: UserReposVariables) {
  const result = await this.graphql<UserReposQueryResult>(USER_REPOS_QUERY, { variables });
  const connection = result.user?.repositories;
  if (!connection) {
    return null;
  }

  return {
    totalCount: connection.totalCount,
    pageInfo: connection.pageInfo,
    edges: (connection.edges ?? [])
      .map((edge) => {
        if (!edge?.node) {
          return null;
        }
        return {
          cursor: edge.cursor,
          node: readFragment(RepoCardFragment, edge.node),
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => edge != null),
  };
}

/**
 * Fetches a page of repositories owned by a user with a minimal payload.
 */
export async function getUserReposMinimal(
  this: GitHubClient,
  variables: UserReposMinimalVariables,
): Promise<UserReposMinimalPage | null> {
  const result = await this.graphql<UserReposMinimalQueryResult>(USER_REPOS_MINIMAL_QUERY, {
    variables,
  });
  const connection = result.user?.repositories;
  if (!connection) {
    return null;
  }

  return {
    totalCount: connection.totalCount,
    pageInfo: connection.pageInfo,
    edges: (connection.edges ?? [])
      .map((edge) => {
        if (!edge?.node) {
          return null;
        }
        return {
          cursor: edge.cursor,
          node: mapRepoMinimal(edge.node),
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => edge != null),
  };
}
