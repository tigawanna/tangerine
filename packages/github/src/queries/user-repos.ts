import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf, type VariablesOf } from "../graphql";
import { RepoCardFragment } from "./fragments/repo-card";

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

export type UserReposQueryResult = ResultOf<typeof UserReposQuery>;
export type UserReposVariables = VariablesOf<typeof UserReposQuery>;

export const USER_REPOS_QUERY = print(UserReposQuery);

/**
 * Fetches a page of repositories owned by a user.
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
