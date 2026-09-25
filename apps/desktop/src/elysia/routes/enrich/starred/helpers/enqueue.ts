import { createGitHubClient, isGithubRateLimited } from "@repo/github";
import { getGithubToken } from "@/lib/github-token.server.ts";
import { sleep } from "@/lib/sse.ts";
import {

  enqueueStarredRepoEmbedJobs,
  type StarredRepoEmbedJob,
} from "@/elysia/routes/enrich/starred/helpers/queue.ts";

export type GetStarredReposInput = {
  login: string;
  /** GraphQL `after` cursor; omit / null for the first page. */
  after?: string | null;
  /** Page size (GitHub max 100). */
  pageSize?: number;
  /** Remaining 429 retries for this page; defaults to `MAX_RATE_LIMIT_RETRIES`. */
  retriesLeft?: number;
};

const DEFAULT_REPO_EMBED_LIMIT = 100;
/** How many times one page is retried after a rate limit before giving up. */
const MAX_RATE_LIMIT_RETRIES = 5;

/** Backoff before retrying a rate-limited page (doubles per attempt, capped). */
const RATE_LIMIT_BACKOFF_MS = 60_000;
const MAX_RATE_LIMIT_BACKOFF_MS = 15 * 60_000;

export type GetStarredReposResult =
  | { data: "crawl-done"; error: null }
  | { data: null; error: "429" };

/**
 * Enqueues every starred repo for `login`, one page per call.
 *
 * Walks pages by tail-recursing with the next cursor. A rate limit (HTTP 429/403,
 * GraphQL body `RATE_LIMITED`) sleeps, then retries the *same* page arguments;
 * once retries run out it gives up with `{ data: null, error: "429" }`.
 *
 * Does not accumulate or return repos — each page is enqueued then dropped so
 * memory stays O(pageSize) instead of O(totalStars). Success is `{ data: "crawl-done" }`.
 */
export async function getStarredRepos(
  input: GetStarredReposInput,
): Promise<GetStarredReposResult> {
  const pageSize = Math.min(input.pageSize ?? DEFAULT_REPO_EMBED_LIMIT, 100);
  const retriesLeft = input.retriesLeft ?? MAX_RATE_LIMIT_RETRIES;

  try {
    const client = createGitHubClient(await getGithubToken());
    const page = await client.getUserStarredReposMinimal({
      login: input.login,
      first: pageSize,
      after: input.after ?? undefined,
    });

    // Empty / missing connection — nothing to enqueue, crawl is done.
    if (!page) {
      return { data: "crawl-done", error: null };
    }

    // Map this page into embed jobs and hand them off; do not keep `repos` around
    // after this — the queue owns the payload from here on.
    const repos: StarredRepoEmbedJob[] = page.edges.map(({ node }) => ({
      id: node.id,
      owner: node.owner.login,
      name: node.name,
      description: node.description,
      tags: node.tags,
      languages: node.tags,
    }));
    await enqueueStarredRepoEmbedJobs(repos);

    // More pages → recurse with the next cursor and a fresh 429 retry budget.
    const { hasNextPage, endCursor } = page.pageInfo;
    if (hasNextPage) {
      return getStarredRepos({ login: input.login, after: endCursor, pageSize });
    }

    // Last page enqueued — crawl finished.
    return { data: "crawl-done", error: null };
  } catch (caught) {
    // Non-rate-limit failures bubble; callers decide how to surface them.
    if (!isGithubRateLimited(caught)) throw caught;

    // Out of retries for this page — stop the crawl.
    if (retriesLeft <= 0) return { data: null, error: "429" };

    // Exponential backoff (1m → 2m → 4m … capped), then retry *this same page*
    // with the previous cursor / pageSize so we do not skip or double-enqueue.
    const attempt = MAX_RATE_LIMIT_RETRIES - retriesLeft;
    const backoffMs = Math.min(RATE_LIMIT_BACKOFF_MS * 2 ** attempt, MAX_RATE_LIMIT_BACKOFF_MS);
    await sleep(backoffMs);

    return getStarredRepos({ ...input, pageSize, retriesLeft: retriesLeft - 1 });
  }
}
