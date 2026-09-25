import { createGitHubClient, isGithubRateLimited } from "@repo/github";
import {
  getGithubToken,
  rememberGithubTokenForWorkers,
} from "@/lib/github-token.server.ts";
import { sleep } from "@/lib/sse.ts";
import {
  DEFAULT_REPO_EMBED_LIMIT,
  enqueueStarredRepoEmbedJobs,
  type StarredRepoEmbedJob,
} from "@/elysia/routes/enrich/starred/helpers/queue.ts";

export type GetStarredReposInput = {
  login: string;
  /** GraphQL `after` cursor; omit / null for the first page. */
  after?: string | null;
  /** Page size (GitHub max 100). */
  pageSize?: number;
  /**
   * Max GraphQL pages to fetch this run (`1` = newest page only, `2` = two pages, …).
   * Omit to crawl until GitHub says there is no next page.
   */
  pages?: number;
  /**
   * Optional OAuth token. Prefer this from HTTP kickoff / scratchpad when
   * `getGithubToken()` may not see a process-seeded worker token.
   */
  token?: string;
  /** Remaining 429 retries for this page; defaults to `MAX_RATE_LIMIT_RETRIES`. */
  retriesLeft?: number;
};

/** How many times one page is retried after a rate limit before giving up. */
const MAX_RATE_LIMIT_RETRIES = 5;

/** Backoff before retrying a rate-limited page (doubles per attempt, capped). */
const RATE_LIMIT_BACKOFF_MS = 60_000;
const MAX_RATE_LIMIT_BACKOFF_MS = 15 * 60_000;

export type GetStarredReposResult =
  | { data: "crawl-done"; error: null }
  /** Page budget exhausted but more stars exist — resume later with this cursor. */
  | { data: { nextCursor: string }; error: null }
  | { data: null; error: "429" };

/**
 * Enqueues starred repos for `login`, one GraphQL page per call.
 *
 * - Omit `pages` → keep going until GitHub has no next page → `"crawl-done"`.
 * - Pass `pages: 1` (or `2`, …) → stop after that many pages; if more remain,
 *   return `{ nextCursor }` so the caller can resume.
 *
 * On rate limit: sleep with exponential backoff, then retry the *same* page args.
 * Repos are enqueued then dropped (no list held in memory across the crawl).
 */
export async function enqueueAllStarredRepos(
  input: GetStarredReposInput,
): Promise<GetStarredReposResult> {
  const pageSize = Math.min(input.pageSize ?? DEFAULT_REPO_EMBED_LIMIT, 100);
  const retriesLeft = input.retriesLeft ?? MAX_RATE_LIMIT_RETRIES;
  // `undefined` = unlimited; otherwise how many pages left including this one.
  const pagesLeft = input.pages;

  try {
    const token = input.token ?? (await getGithubToken());
    if (input.token) rememberGithubTokenForWorkers(input.token);

    const client = createGitHubClient(token);
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

    const { hasNextPage, endCursor } = page.pageInfo;

    // No more GitHub pages — finished the full list.
    if (!hasNextPage || !endCursor) {
      return { data: "crawl-done", error: null };
    }

    // Page budget exhausted for this run — hand back the cursor to resume later.
    if (pagesLeft !== undefined && pagesLeft <= 1) {
      return { data: { nextCursor: endCursor }, error: null };
    }

    // More pages (and budget left) → recurse with next cursor + fresh 429 retries.
    return enqueueAllStarredRepos({
      login: input.login,
      after: endCursor,
      pageSize,
      pages: pagesLeft === undefined ? undefined : pagesLeft - 1,
      token: input.token,
    });
  } catch (caught) {
    // Non-rate-limit failures bubble; callers decide how to surface them.
    if (!isGithubRateLimited(caught)) throw caught;

    // Out of retries for this page — stop the crawl.
    if (retriesLeft <= 0) return { data: null, error: "429" };

    // Exponential backoff (1m → 2m → 4m … capped), then retry *this same page*
    // with the previous cursor / pageSize / pages budget so we do not skip work.
    const attempt = MAX_RATE_LIMIT_RETRIES - retriesLeft;
    const backoffMs = Math.min(RATE_LIMIT_BACKOFF_MS * 2 ** attempt, MAX_RATE_LIMIT_BACKOFF_MS);
    await sleep(backoffMs);

    return enqueueAllStarredRepos({ ...input, pageSize, retriesLeft: retriesLeft - 1 });
  }
}
