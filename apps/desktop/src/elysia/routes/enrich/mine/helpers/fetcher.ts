import { getGithubToken } from "@/lib/github-token.server.ts";
import {
  createGitHubClient,
  isGithubRateLimited,
  type UserReposVariables,
} from "@repo/github";

type GetMyReposProps = Omit<UserReposVariables, "login"> & {
  login?: string;
};

export async function getMyRepos({
  login,
  after = null,
  first = 100,
  isFork = false,
  orderBy = { field: "CREATED_AT", direction: "DESC" },
}: GetMyReposProps = {}) {
  try {
    const token = await getGithubToken();
    const client = createGitHubClient(token);
    const resolvedLogin = login ?? (await client.getViewer()).login;
    const page = await client.getUserRepos({
      login: resolvedLogin,
      after,
      first,
      isFork,
      orderBy,
    });

    if (!page) {
      return { data: null, error: "No repositories found" };
    }

    return {
      data: {
        repos: page.edges.map(({ node }) => node),
        pageInfo: page.pageInfo,
        totalCount: page.totalCount,
      },
      error: null,
    };
  } catch (error) {
    if (isGithubRateLimited(error)) {
      return { data: null, error: "429" as const };
    }
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type MyReposPage = NonNullable<Awaited<ReturnType<typeof getMyRepos>>["data"]>;
