import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf } from "../graphql";
import { UserCardFragment } from "./fragments/user-card";

/**
 * Minimal authenticated-viewer probe used to validate the gql.tada setup.
 */
export const ViewerQuery = graphql(`
  query Viewer {
    viewer {
      login
      name
      avatarUrl
    }
  }
`);

/**
 * User profile by login (Relay `UserInfo` / layout user loader, without Relay fragment spreads).
 */
export const UserProfileQuery = graphql(
  `
    query UserProfile($login: String!) {
      user(login: $login) {
        ...UserCard
      }
    }
  `,
  [UserCardFragment],
);

export type ViewerQueryResult = ResultOf<typeof ViewerQuery>;
export type UserProfileQueryResult = ResultOf<typeof UserProfileQuery>;

export const VIEWER_QUERY = print(ViewerQuery);
export const USER_PROFILE_QUERY = print(UserProfileQuery);

/**
 * Fetches the authenticated GitHub viewer.
 */
export async function getViewer(this: GitHubClient) {
  const result = await this.graphql<ViewerQueryResult>(VIEWER_QUERY);
  return result.viewer;
}

/**
 * Fetches a user profile by login.
 */
export async function getUserProfile(this: GitHubClient, login: string) {
  const result = await this.graphql<UserProfileQueryResult>(USER_PROFILE_QUERY, {
    variables: { login },
  });
  if (!result.user) {
    return null;
  }
  return readFragment(UserCardFragment, result.user);
}
