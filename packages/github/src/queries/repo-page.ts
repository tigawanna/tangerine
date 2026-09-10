import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf, type VariablesOf } from "../graphql";
import { RepoGeneralInfoFragment } from "./fragments/repo-general-info";
import { UserCardFragment } from "./fragments/user-card";

/**
 * Full repository page payload (Relay `OneUserRepoPageQuery` + nested fragments).
 */
export const RepoPageQuery = graphql(
  `
    query RepoPage(
      $owner: String!
      $name: String!
      $stargazerFirst: Int = 5
      $stargazerAfter: String
      $branchFirst: Int = 3
      $branchAfter: String
      $commitFirst: Int = 5
      $commitAfter: String
    ) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          name
          id
        }
        ...RepoGeneralInfo
        stargazers(first: $stargazerFirst, after: $stargazerAfter) {
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
        refs(
          refPrefix: "refs/heads/"
          orderBy: { direction: DESC, field: TAG_COMMIT_DATE }
          first: $branchFirst
          after: $branchAfter
        ) {
          totalCount
          edges {
            node {
              name
              id
              target {
                __typename
                ... on Commit {
                  history(first: $commitFirst, after: $commitAfter) {
                    totalCount
                    edges {
                      node {
                        oid
                        abbreviatedOid
                        committedDate
                        authoredDate
                        message
                        url
                        author {
                          name
                          email
                        }
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
  [RepoGeneralInfoFragment, UserCardFragment],
);

export const RepoLanguagesQuery = graphql(`
  query RepoLanguages($owner: String!, $name: String!, $first: Int = 20, $after: String) {
    repository(owner: $owner, name: $name) {
      languages(first: $first, after: $after) {
        totalCount
        edges {
          node {
            id
            color
            name
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
`);

export const RepoStargazersQuery = graphql(
  `
    query RepoStargazers($owner: String!, $name: String!, $first: Int = 5, $after: String) {
      repository(owner: $owner, name: $name) {
        stargazers(first: $first, after: $after) {
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

export type RepoPageQueryResult = ResultOf<typeof RepoPageQuery>;
export type RepoPageVariables = VariablesOf<typeof RepoPageQuery>;
export type RepoLanguagesQueryResult = ResultOf<typeof RepoLanguagesQuery>;
export type RepoLanguagesVariables = VariablesOf<typeof RepoLanguagesQuery>;
export type RepoStargazersQueryResult = ResultOf<typeof RepoStargazersQuery>;
export type RepoStargazersVariables = VariablesOf<typeof RepoStargazersQuery>;

export type RepoPageInfo = {
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
};

export type RepoCommit = {
  oid: string;
  abbreviatedOid: string;
  committedDate: string;
  authoredDate: string;
  message: string;
  url: string;
  author: {
    name: string | null;
    email: string | null;
  } | null;
};

export type RepoBranch = {
  id: string;
  name: string;
  commits: {
    totalCount: number;
    pageInfo: RepoPageInfo;
    nodes: RepoCommit[];
  };
};

export type RepoBranchesPayload = {
  defaultBranchName: string | null;
  totalCount: number;
  pageInfo: RepoPageInfo | null;
  branches: RepoBranch[];
};

type CommitHistoryConnection = {
  totalCount: number;
  pageInfo: RepoPageInfo;
  edges: Array<{
    node: {
      oid: string;
      abbreviatedOid: string;
      committedDate: string;
      authoredDate: string;
      message: string;
      url: string;
      author: { name: string | null; email: string | null } | null;
    } | null;
  } | null> | null;
};

/**
 * Maps a GraphQL commit history connection into a flat commit list.
 */
function mapCommitHistory(history: CommitHistoryConnection | null | undefined) {
  if (!history) {
    return {
      totalCount: 0,
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
      } satisfies RepoPageInfo,
      nodes: [] as RepoCommit[],
    };
  }

  return {
    totalCount: history.totalCount,
    pageInfo: history.pageInfo,
    nodes: (history.edges ?? [])
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node != null)
      .map(
        (node) =>
          ({
            oid: node.oid,
            abbreviatedOid: node.abbreviatedOid,
            committedDate: node.committedDate,
            authoredDate: node.authoredDate,
            message: node.message,
            url: node.url,
            author: node.author
              ? { name: node.author.name ?? null, email: node.author.email ?? null }
              : null,
          }) satisfies RepoCommit,
      ),
  };
}

/**
 * Maps repository `refs` edges into branch + commit payloads.
 */
function mapBranchEdges(
  edges:
    | Array<{
        node: {
          id: string;
          name: string;
          target:
            | {
                __typename: string;
                history?: CommitHistoryConnection | null;
              }
            | null;
        } | null;
      } | null>
    | null
    | undefined,
): RepoBranch[] {
  return (edges ?? [])
    .map((edge) => edge?.node)
    .filter((node): node is NonNullable<typeof node> => node != null)
    .map((node) => {
      const history =
        node.target && "history" in node.target ? (node.target.history ?? null) : null;
      return {
        id: node.id,
        name: node.name,
        commits: mapCommitHistory(history),
      } satisfies RepoBranch;
    });
}

export const REPO_PAGE_QUERY = print(RepoPageQuery);
export const REPO_LANGUAGES_QUERY = print(RepoLanguagesQuery);
export const REPO_STARGAZERS_QUERY = print(RepoStargazersQuery);

/**
 * Fetches the repository detail page (general info + stargazers + branches/commits).
 */
export async function getRepoPage(this: GitHubClient, variables: RepoPageVariables) {
  const result = await this.graphql<RepoPageQueryResult>(REPO_PAGE_QUERY, { variables });
  const repository = result.repository;
  if (!repository) {
    return null;
  }

  return {
    defaultBranchRef: repository.defaultBranchRef,
    info: readFragment(RepoGeneralInfoFragment, repository),
    stargazers: {
      pageInfo: repository.stargazers.pageInfo,
      nodes: (repository.stargazers.edges ?? [])
        .map((edge) => edge?.node)
        .filter((node): node is NonNullable<typeof node> => node != null)
        .map((node) => readFragment(UserCardFragment, node)),
    },
    branches: {
      totalCount: repository.refs?.totalCount ?? 0,
      pageInfo: repository.refs?.pageInfo ?? null,
      nodes: mapBranchEdges(repository.refs?.edges),
    },
  };
}

/**
 * Fetches paginated languages for a repository (Relay `Languages_languages` → query).
 */
export async function getRepoLanguages(this: GitHubClient, variables: RepoLanguagesVariables) {
  const result = await this.graphql<RepoLanguagesQueryResult>(REPO_LANGUAGES_QUERY, {
    variables,
  });
  return result.repository?.languages ?? null;
}

/**
 * Fetches paginated stargazers for a repository (Relay `Stargazers_stargazers` → query).
 */
export async function getRepoStargazers(this: GitHubClient, variables: RepoStargazersVariables) {
  const result = await this.graphql<RepoStargazersQueryResult>(REPO_STARGAZERS_QUERY, {
    variables,
  });
  const connection = result.repository?.stargazers;
  if (!connection) {
    return null;
  }

  return {
    pageInfo: connection.pageInfo,
    nodes: (connection.edges ?? [])
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node != null)
      .map((node) => readFragment(UserCardFragment, node)),
  };
}
