import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf, type VariablesOf } from "../graphql";
import { RepoCardFragment } from "./fragments/repo-card";

/**
 * Paginated starred repositories for a user (Relay `UserStarredRepos_repositories` → query).
 */
export const UserStarredReposQuery = graphql(
  `
    query UserStarredRepos(
      $login: String!
      $first: Int = 24
      $after: String
      $orderBy: StarOrder = { field: STARRED_AT, direction: DESC }
    ) {
      user(login: $login) {
        starredRepositories(first: $first, after: $after, orderBy: $orderBy) {
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

export type UserStarredReposQueryResult = ResultOf<typeof UserStarredReposQuery>;
export type UserStarredReposVariables = VariablesOf<typeof UserStarredReposQuery>;

export const USER_STARRED_REPOS_QUERY = print(UserStarredReposQuery);

/**
 * Fetches a page of repositories starred by a user.
 */
export async function getUserStarredRepos(
  this: GitHubClient,
  variables: UserStarredReposVariables,
) {
  const result = await this.graphql<UserStarredReposQueryResult>(USER_STARRED_REPOS_QUERY, {
    variables,
  });
  const connection = result.user?.starredRepositories;
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
