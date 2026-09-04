export const RECENT_REPOS_QUERY = `query getViewerRecentlyPushedRepos(
  $first: Int!,
  $isFork: Boolean,
  $orderField: RepositoryOrderField!,
  $orderDirection: OrderDirection!
) {
  viewer {
    repositories(
      orderBy: { field: $orderField, direction: $orderDirection },
      first: $first,
      isFork: $isFork
    ) {
      nodes {
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
          defaultBranchRef { name }
          repositoryTopics(first: 10) {
            nodes {
              topic { name }
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
}`;

export const PINNED_REPOS_QUERY = `query getViewerPinnedRepos {
  viewer {
    pinnedItems(first: 6, types: [REPOSITORY]) {
      nodes {
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
          defaultBranchRef { name }
          repositoryTopics(first: 10) {
            nodes {
              topic { name }
            }
          }
        }
      }
    }
  }
}`;

export const ONE_REPO_QUERY = `query OneRepo($owner: String!, $repo: String!, $firstTopics: Int!, $firstLangs: Int!) {
  repository(name: $repo, owner: $owner) {
    createdAt
    forkCount
    id
    homepageUrl
    isPrivate
    isFork
    isEmpty
    description
    isTemplate
    repositoryTopics(first: $firstTopics) {
      edges {
        node {
          topic { name }
        }
      }
    }
    name
    nameWithOwner
    openGraphImageUrl
    updatedAt
    url
    languages(first: $firstLangs) {
      edges {
        size
        node { color name }
      }
      totalSize
    }
  }
}`;

export const ENRICHMENT_RECENT_REPOS_QUERY = `query getViewerRecentlyPushedRepos($first: Int!) {
  viewer {
    repositories(orderBy: { field: PUSHED_AT, direction: DESC }, first: $first, isFork: false) {
      nodes {
        ... on Repository {
          id
          name
          nameWithOwner
          description
          descriptionHTML
          homepageUrl
          openGraphImageUrl
          isPrivate
          defaultBranchRef { name }
          repositoryTopics(first: 20) {
            nodes { topic { name } }
          }
        }
      }
    }
  }
}`;

export const REPO_BY_NAME_QUERY = `query getRepoByName($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    nameWithOwner
    description
    homepageUrl
    openGraphImageUrl
    isPrivate
    defaultBranchRef { name }
    repositoryTopics(first: 20) {
      nodes { topic { name } }
    }
  }
}`;
