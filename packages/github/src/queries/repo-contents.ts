import type { GitHubClient } from "../client";
import type { GitTreeEntry } from "../types";
import { decodeBase64Content, isNotFoundError } from "./helpers";

/**
 * Returns a recursive git tree for a repository branch.
 */
export async function getRepoTree(
  this: GitHubClient,
  owner: string,
  repo: string,
  branch: string,
  recursive = true,
): Promise<GitTreeEntry[] | null> {
  try {
    const response = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: recursive ? "1" : undefined,
    });
    return response.data.tree;
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

/**
 * Returns decoded file content from a repository path, or null when missing.
 */
export async function getRepoFileContent(
  this: GitHubClient,
  owner: string,
  repo: string,
  path: string,
  ref: string,
) {
  try {
    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(response.data) || response.data.type !== "file") {
      return null;
    }

    if (response.data.encoding !== "base64" || !response.data.content) {
      return null;
    }

    return decodeBase64Content(response.data.content);
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

/**
 * Returns the repository README (any common filename) via the GitHub REST API.
 */
export async function getRepoReadme(this: GitHubClient, owner: string, repo: string) {
  try {
    const response = await this.octokit.rest.repos.getReadme({ owner, repo });

    if (response.data.encoding !== "base64" || !response.data.content) {
      return null;
    }

    return {
      content: decodeBase64Content(response.data.content),
      path: response.data.path,
    };
  } catch (error: unknown) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
