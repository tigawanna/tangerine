import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, type ResultOf } from "../graphql";
import type { GithubRepoSnapshot } from "../types";
import { mapEnrichmentRepoNode } from "../utils/repo";

export const OneRepoQuery = graphql(`
  query OneRepo($owner: String!, $repo: String!, $firstTopics: Int!, $firstLangs: Int!) {
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
            topic {
              name
            }
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
          node {
            color
            name
          }
        }
        totalSize
      }
    }
  }
`);

export const RepoByNameQuery = graphql(`
  query getRepoByName($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      name
      nameWithOwner
      description
      homepageUrl
      openGraphImageUrl
      isPrivate
      defaultBranchRef {
        name
      }
      repositoryTopics(first: 20) {
        nodes {
          topic {
            name
          }
        }
      }
    }
  }
`);

export type OneRepoQueryResult = ResultOf<typeof OneRepoQuery>;
export type RepoByNameQueryResult = ResultOf<typeof RepoByNameQuery>;

/** Single-repository detail payload from `OneRepoQuery`. */
export type GithubRepoDetail = NonNullable<OneRepoQueryResult["repository"]>;

export const ONE_REPO_QUERY = print(OneRepoQuery);
export const REPO_BY_NAME_QUERY = print(RepoByNameQuery);

/**
 * Fetches a single repository with languages and topics.
 */
export async function getRepoDetail(this: GitHubClient, owner: string, repo: string) {
  const result = await this.graphql<OneRepoQueryResult>(ONE_REPO_QUERY, {
    variables: { owner, repo, firstTopics: 10, firstLangs: 10 },
  });
  return result.repository;
}

/**
 * Fetches repository snapshots by `owner/repo` full names.
 */
export async function getRepoSnapshotsByFullNames(this: GitHubClient, fullNames: string[]) {
  const repos: GithubRepoSnapshot[] = [];

  for (const fullName of fullNames) {
    const [owner, name] = fullName.split("/");
    if (!owner || !name) {
      continue;
    }

    const result = await this.graphql<RepoByNameQueryResult>(REPO_BY_NAME_QUERY, {
      variables: { owner, name },
    });

    const node = result.repository;
    if (node && !node.isPrivate) {
      repos.push(
        mapEnrichmentRepoNode({
          ...node,
          repositoryTopics: {
            nodes: (node.repositoryTopics.nodes ?? []).filter(
              (entry): entry is { topic: { name: string } } => entry != null,
            ),
          },
        }),
      );
    }
  }

  return repos;
}
