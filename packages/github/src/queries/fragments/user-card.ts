import { graphql } from "../../graphql";

/**
 * Shared user card fields (Relay `UserFragmentCard_user` / `UserInfo`).
 */
export const UserCardFragment = graphql(`
  fragment UserCard on User {
    id
    name
    login
    email
    bio
    avatarUrl
    company
    twitterUsername
    createdAt
    isFollowingViewer
    viewerIsFollowing
    isViewer
    location
    url
  }
`);
