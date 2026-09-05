import { graphql } from "../../graphql";

/**
 * Repository card fields (Relay `RepoCard_reposiotory`).
 */
export const RepoCardFragment = graphql(`
  fragment RepoCard on Repository {
    id
    name
    nameWithOwner
    description
    pushedAt
    diskUsage
    url
    visibility
    forkCount
    openGraphImageUrl
    isInOrganization
    forkingAllowed
    isFork
    viewerHasStarred
    viewerPermission
    viewerCanAdminister
    stargazerCount
    owner {
      login
      id
      url
      avatarUrl
    }
    languages(first: 3) {
      edges {
        node {
          id
          color
          name
        }
      }
    }
    refs(refPrefix: "refs/heads/", orderBy: { direction: DESC, field: TAG_COMMIT_DATE }, first: 2) {
      edges {
        node {
          name
          id
          target {
            __typename
            ... on Commit {
              history(first: 1) {
                edges {
                  node {
                    id
                    url
                    committedDate
                    author {
                      name
                    }
                    message
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);
