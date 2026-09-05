import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf, type VariablesOf } from "../graphql";
import { UserCardFragment } from "./fragments/user-card";

export const UserFollowersQuery = graphql(
  `
    query UserFollowers($login: String!, $first: Int = 10, $after: String) {
      user(login: $login) {
        followers(first: $first, after: $after) {
          totalCount
          edges {
            cursor
            node {
              ...UserCard
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
  [UserCardFragment],
);

export const UserFollowingQuery = graphql(
  `
    query UserFollowing($login: String!, $first: Int = 10, $after: String) {
      user(login: $login) {
        following(first: $first, after: $after) {
          totalCount
          edges {
            cursor
            node {
              ...UserCard
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
  [UserCardFragment],
);

export type UserFollowersQueryResult = ResultOf<typeof UserFollowersQuery>;
export type UserFollowingQueryResult = ResultOf<typeof UserFollowingQuery>;
export type UserFollowersVariables = VariablesOf<typeof UserFollowersQuery>;
export type UserFollowingVariables = VariablesOf<typeof UserFollowingQuery>;

export const USER_FOLLOWERS_QUERY = print(UserFollowersQuery);
export const USER_FOLLOWING_QUERY = print(UserFollowingQuery);

/**
 * Fetches a page of followers for a user (Relay `UserFollowersFragment` → query).
 */
export async function getUserFollowers(this: GitHubClient, variables: UserFollowersVariables) {
  const result = await this.graphql<UserFollowersQueryResult>(USER_FOLLOWERS_QUERY, {
    variables,
  });
  const connection = result.user?.followers;
  if (!connection) {
    return null;
  }

  return {
    totalCount: connection.totalCount,
    pageInfo: connection.pageInfo,
    nodes: (connection.edges ?? [])
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node != null)
      .map((node) => readFragment(UserCardFragment, node)),
  };
}

/**
 * Fetches a page of users this login follows (Relay `UserFollowingFragment` → query).
 */
export async function getUserFollowing(this: GitHubClient, variables: UserFollowingVariables) {
  const result = await this.graphql<UserFollowingQueryResult>(USER_FOLLOWING_QUERY, {
    variables,
  });
  const connection = result.user?.following;
  if (!connection) {
    return null;
  }

  return {
    totalCount: connection.totalCount,
    pageInfo: connection.pageInfo,
    nodes: (connection.edges ?? [])
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node != null)
      .map((node) => readFragment(UserCardFragment, node)),
  };
}
