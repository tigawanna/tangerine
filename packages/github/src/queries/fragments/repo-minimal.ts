import { graphql, readFragment, type FragmentOf } from "../../graphql";

/**
 * Lean repository fields for list/crawl pages (no refs, history, or card chrome).
 */
export const RepoMinimalFragment = graphql(`
  fragment RepoMinimal on Repository {
    id
    name
    description
    url
    homepageUrl
    owner {
      login
    }
    repositoryTopics(first: 10) {
      nodes {
        topic {
          name
        }
      }
    }
  }
`);

/** Flattened minimal repo node for list/crawl APIs. */
export type RepoMinimal = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  /** Repo website / homepage, if set. */
  homepageUrl: string | null;
  owner: { login: string };
  /** Topic tags from `repositoryTopics`. */
  tags: string[];
};

/**
 * Maps a `RepoMinimal` GraphQL fragment mask into a plain list node.
 */
export function mapRepoMinimal(node: FragmentOf<typeof RepoMinimalFragment>): RepoMinimal {
  const repo = readFragment(RepoMinimalFragment, node);
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description ?? null,
    url: repo.url,
    homepageUrl: repo.homepageUrl ?? null,
    owner: { login: repo.owner.login },
    tags: (repo.repositoryTopics?.nodes ?? [])
      .map((entry) => entry?.topic?.name)
      .filter((name): name is string => Boolean(name)),
  };
}
