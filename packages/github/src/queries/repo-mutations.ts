import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, type ResultOf } from "../graphql";
import { splitRepoFullName } from "../utils/repo";

export const AddStarMutation = graphql(`
  mutation AddStar($starrableId: ID!) {
    addStar(input: { starrableId: $starrableId }) {
      starrable {
        __typename
        ... on Repository {
          id
          stargazerCount
          viewerHasStarred
        }
      }
    }
  }
`);

export const RemoveStarMutation = graphql(`
  mutation RemoveStar($starrableId: ID!) {
    removeStar(input: { starrableId: $starrableId }) {
      starrable {
        __typename
        ... on Repository {
          id
          stargazerCount
          viewerHasStarred
        }
      }
    }
  }
`);

export type AddStarMutationResult = ResultOf<typeof AddStarMutation>;
export type RemoveStarMutationResult = ResultOf<typeof RemoveStarMutation>;

export const ADD_STAR_MUTATION = print(AddStarMutation);
export const REMOVE_STAR_MUTATION = print(RemoveStarMutation);

/**
 * Deletes a repository by `owner/repo` full name.
 */
export async function deleteRepo(this: GitHubClient, fullName: string) {
  const { owner, repo } = splitRepoFullName(fullName);
  await this.octokit.rest.repos.delete({ owner, repo });
}

/**
 * Updates repository visibility between public and private.
 */
export async function setRepoVisibility(
  this: GitHubClient,
  fullName: string,
  visibility: "public" | "private",
) {
  const { owner, repo } = splitRepoFullName(fullName);
  await this.octokit.rest.repos.update({
    owner,
    repo,
    private: visibility === "private",
    visibility,
  });
}

/**
 * Updates repository description, homepage, and topics.
 */
export async function applyRepoMetadata(
  this: GitHubClient,
  fullName: string,
  input: {
    description: string;
    homepage?: string | null;
    topics: string[];
  },
) {
  const { owner, repo } = splitRepoFullName(fullName);

  await this.octokit.rest.repos.update({
    owner,
    repo,
    description: input.description,
    homepage: input.homepage || undefined,
  });

  await this.octokit.rest.repos.replaceAllTopics({
    owner,
    repo,
    names: input.topics,
  });
}

/**
 * Stars a repository (or other starrable) by node id.
 */
export async function addStar(this: GitHubClient, starrableId: string) {
  const result = await this.graphql<AddStarMutationResult>(ADD_STAR_MUTATION, {
    variables: { starrableId },
  });
  const starrable = result.addStar?.starrable;
  if (starrable?.__typename !== "Repository") {
    return null;
  }
  return starrable;
}

/**
 * Removes a star from a repository (or other starrable) by node id.
 */
export async function removeStar(this: GitHubClient, starrableId: string) {
  const result = await this.graphql<RemoveStarMutationResult>(REMOVE_STAR_MUTATION, {
    variables: { starrableId },
  });
  const starrable = result.removeStar?.starrable;
  if (starrable?.__typename !== "Repository") {
    return null;
  }
  return starrable;
}
