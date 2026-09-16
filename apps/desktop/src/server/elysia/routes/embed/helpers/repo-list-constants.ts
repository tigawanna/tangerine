/** Job name for one starred-list page fetch. */
export const REPO_EMBED_LIST_JOB_NAME = "fetch-starred-page";

export const REPO_EMBED_LIST_QUEUE = "repo-embed-list";

/** Pause before retrying the same page after a GitHub rate limit. */
export const RATE_LIMIT_DELAY = "60s";

/** Small gap between successful pages to stay under secondary limits. */
export const PAGE_GAP_DELAY = "2s";

/** Worker limiter: at most one list page every 2s. */
export const LIST_WORKER_LIMITER = { max: 1, duration: 2_000 } as const;
