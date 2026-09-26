import { createGitHubClient, isGithubRateLimited } from "@repo/github";
import {
  getGithubToken,
  rememberGithubTokenForWorkers,
} from "@/lib/github-token.server.ts";
import { sleep } from "@/lib/sse.ts";
import {
  DEFAULT_USER_REPO_EMBED_LIMIT,
  enqueueUserRepoEmbedJobs,
  type UserRepoEmbedJob,
} from "@/elysia/routes/enrich/repos/helpers/queue.ts";

export type EnqueueUserReposInput = {
  /** GitHub login whose owned repos to crawl (usually the `$user` route param). */
  login: string;
  after?: string | null;
  pageSize?: number;
  /**
   * Max GraphQL pages this run. Omit for a full crawl.
   * Default UI “top 100” is `pages: 1` with `pageSize: 100`.
   */
  pages?: number;
  token?: string;
  retriesLeft?: number;
};

const MAX_RATE_LIMIT_RETRIES = 5;
const RATE_LIMIT_BACKOFF_MS = 60_000;
const MAX_RATE_LIMIT_BACKOFF_MS = 15 * 60_000;

export type EnqueueUserReposResult =
  | { data: "crawl-done"; error: null }
  | { data: { nextCursor: string }; error: null }
  | { data: null; error: "429" };

/**
 * Enqueues owned repos for `login`, one GraphQL page per call (STARGAZERS DESC).
 */
export async function enqueueAllUserRepos(
  input: EnqueueUserReposInput,
): Promise<EnqueueUserReposResult> {
  const pageSize = Math.min(input.pageSize ?? DEFAULT_USER_REPO_EMBED_LIMIT, 100);
  const retriesLeft = input.retriesLeft ?? MAX_RATE_LIMIT_RETRIES;
  const pagesLeft = input.pages;

  try {
    const token = input.token ?? (await getGithubToken());
    if (input.token) rememberGithubTokenForWorkers(input.token);

    const client = createGitHubClient(token);
    const page = await client.getUserReposMinimal({
      login: input.login,
      first: pageSize,
      after: input.after ?? undefined,
      isFork: false,
      orderBy: { field: "STARGAZERS", direction: "DESC" },
    });

    if (!page) {
      return { data: "crawl-done", error: null };
    }

    const repos: UserRepoEmbedJob[] = page.edges.map(({ node }) => ({
      id: node.id,
      owner: node.owner.login,
      name: node.name,
      description: node.description,
      tags: node.tags,
      languages: node.tags,
    }));
    await enqueueUserRepoEmbedJobs(repos);

    const { hasNextPage, endCursor } = page.pageInfo;

    if (!hasNextPage || !endCursor) {
      return { data: "crawl-done", error: null };
    }

    if (pagesLeft !== undefined && pagesLeft <= 1) {
      return { data: { nextCursor: endCursor }, error: null };
    }

    return enqueueAllUserRepos({
      login: input.login,
      after: endCursor,
      pageSize,
      pages: pagesLeft === undefined ? undefined : pagesLeft - 1,
      token: input.token,
    });
  } catch (caught) {
    if (!isGithubRateLimited(caught)) throw caught;
    if (retriesLeft <= 0) return { data: null, error: "429" };

    const attempt = MAX_RATE_LIMIT_RETRIES - retriesLeft;
    const backoffMs = Math.min(RATE_LIMIT_BACKOFF_MS * 2 ** attempt, MAX_RATE_LIMIT_BACKOFF_MS);
    await sleep(backoffMs);

    return enqueueAllUserRepos({ ...input, pageSize, retriesLeft: retriesLeft - 1 });
  }
}
