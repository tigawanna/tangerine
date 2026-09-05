import { graphql } from "../../graphql";

/**
 * Search hit shapes (Relay `SearchRepoResultsFraggment` / `SearchUserResultsfragment`).
 */
export const SearchRepoFragment = graphql(`
  fragment SearchRepo on Repository {
    id
    nameWithOwner
    forkCount
    pushedAt
    diskUsage
    visibility
    url
    stargazerCount
    description
    openGraphImageUrl
    viewerHasStarred
    createdAt
  }
`);

export const SearchUserFragment = graphql(`
  fragment SearchUser on User {
    id
    bio
    name
    avatarUrl(size: 150)
    login
    url
  }
`);
