import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, type ResultOf } from "../graphql";

export const FollowUserMutation = graphql(`
  mutation FollowUser($userId: ID!) {
    followUser(input: { userId: $userId }) {
      clientMutationId
      user {
        id
        viewerIsFollowing
        isFollowingViewer
      }
    }
  }
`);

export const UnfollowUserMutation = graphql(`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(input: { userId: $userId }) {
      clientMutationId
      user {
        id
        viewerIsFollowing
        isFollowingViewer
      }
    }
  }
`);

export type FollowUserMutationResult = ResultOf<typeof FollowUserMutation>;
export type UnfollowUserMutationResult = ResultOf<typeof UnfollowUserMutation>;

export const FOLLOW_USER_MUTATION = print(FollowUserMutation);
export const UNFOLLOW_USER_MUTATION = print(UnfollowUserMutation);

/**
 * Follows a user by node id (Relay `UserInfofollowMutation`).
 */
export async function followUser(this: GitHubClient, userId: string) {
  const result = await this.graphql<FollowUserMutationResult>(FOLLOW_USER_MUTATION, {
    variables: { userId },
  });
  return result.followUser?.user ?? null;
}

/**
 * Unfollows a user by node id (Relay `UserInfounfollowMutation`).
 */
export async function unfollowUser(this: GitHubClient, userId: string) {
  const result = await this.graphql<UnfollowUserMutationResult>(UNFOLLOW_USER_MUTATION, {
    variables: { userId },
  });
  return result.unfollowUser?.user ?? null;
}
