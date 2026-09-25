import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import { starredRepoEmbedQueue } from "@/elysia/routes/enrich/starred/helpers/queue.ts";

export type EmbedActivityPhase =
  | "idle"
  | "listing"
  | "embedding"
  | "waiting"
  | "done"
  | "error";

export type EmbedActivityStatus = {
  phase: EmbedActivityPhase;
  login: string | null;
  list: {
    after: string | null;
    fetchedTotal: number;
    enqueuedTotal: number;
    totalCount: number | null;
    rateLimited: boolean;
  };
  embed: {
    current: { owner: string; name: string } | null;
    completed: number;
    failed: number;
    lastError: string | null;
  };
  message: string | null;
  updatedAt: string;
};

/** List SoT row without the vector blob (safe for SSE). */
export type EmbedActivityRepoRow = {
  id: string;
  owner: string;
  name: string;
  type: "starred" | null;
  description: string | null;
  summary: string | null;
  url: string | null;
  sourceGeneration: number;
  payload: Record<string, unknown>;
  modelId: string | null;
  embeddedAt: Date | string | null;
  createdAt: Date | string;
};

/** SSE frame: live status + optional newly upserted list row. */
export type EmbedActivitySsePayload = {
  status: EmbedActivityStatus;
  row: EmbedActivityRepoRow | null;
};

/** Explicit patch shape so nested fields stay optional (not `Partial<Status>`). */
export type EmbedActivityPatch = {
  phase?: EmbedActivityPhase;
  login?: string | null;
  message?: string | null;
  list?: {
    after?: string | null;
    fetchedTotal?: number;
    enqueuedTotal?: number;
    totalCount?: number | null;
    rateLimited?: boolean;
  };
  embed?: {
    current?: { owner: string; name: string } | null;
    completed?: number;
    failed?: number;
    lastError?: string | null;
  };
};

const idleStatus = (): EmbedActivityStatus => ({
  phase: "idle",
  login: null,
  list: {
    after: null,
    fetchedTotal: 0,
    enqueuedTotal: 0,
    totalCount: null,
    rateLimited: false,
  },
  embed: {
    current: null,
    completed: 0,
    failed: 0,
    lastError: null,
  },
  message: null,
  updatedAt: new Date().toISOString(),
});

const GLOBAL_KEY = "__tangerineEmbedActivity__" as const;

type EmbedActivityGlobal = {
  status: EmbedActivityStatus;
  listCrawlInFlight: boolean;
};

type GlobalWithEmbedActivity = typeof globalThis & {
  [GLOBAL_KEY]?: EmbedActivityGlobal;
};

/** Survive Vite/HMR so SSE clients and workers share one status. */
function store(): EmbedActivityGlobal {
  const g = globalThis as GlobalWithEmbedActivity;
  g[GLOBAL_KEY] ??= {
    status: idleStatus(),
    listCrawlInFlight: false,
  };
  return g[GLOBAL_KEY];
}

/** Latest snapshot for GET / status. */
export function getEmbedActivityStatus(): EmbedActivityStatus {
  return store().status;
}

function emitActivity(row: EmbedActivityRepoRow | null = null): EmbedActivitySsePayload {
  const payload: EmbedActivitySsePayload = { status: store().status, row };
  pubSub.publish(PUB_SUB_TOPICS.REPO_EMBED_PROGRESS, payload);
  return payload;
}

/** Patch status and notify SSE listeners. */
export function patchEmbedActivity(
  partial: EmbedActivityPatch,
  row: EmbedActivityRepoRow | null = null,
): EmbedActivityStatus {
  const prev = store().status;
  store().status = {
    phase: partial.phase ?? prev.phase,
    login: partial.login !== undefined ? partial.login : prev.login,
    message: partial.message !== undefined ? partial.message : prev.message,
    list: {
      after: partial.list?.after !== undefined ? partial.list.after : prev.list.after,
      fetchedTotal: partial.list?.fetchedTotal ?? prev.list.fetchedTotal,
      enqueuedTotal: partial.list?.enqueuedTotal ?? prev.list.enqueuedTotal,
      totalCount:
        partial.list?.totalCount !== undefined ? partial.list.totalCount : prev.list.totalCount,
      rateLimited: partial.list?.rateLimited ?? prev.list.rateLimited,
    },
    embed: {
      current: partial.embed?.current !== undefined ? partial.embed.current : prev.embed.current,
      completed: partial.embed?.completed ?? prev.embed.completed,
      failed: partial.embed?.failed ?? prev.embed.failed,
      lastError:
        partial.embed?.lastError !== undefined ? partial.embed.lastError : prev.embed.lastError,
    },
    updatedAt: new Date().toISOString(),
  };
  emitActivity(row);
  return store().status;
}

/** Reset counters when starting a new crawl. */
export function resetEmbedActivity(login: string): EmbedActivityStatus {
  store().status = {
    ...idleStatus(),
    phase: "listing",
    login,
    message: "Starting starred-list crawl…",
  };
  emitActivity(null);
  return store().status;
}

/** Mark the starred-list enqueue as in-flight (call before kickoff). */
export function beginListCrawl(): void {
  store().listCrawlInFlight = true;
}

/** Call when the starred-list enqueue promise settles. */
export function markListCrawlSettled(): void {
  store().listCrawlInFlight = false;
}

type MarkDoneOptions = {
  /**
   * End-of-batch: current jobs are still `active` until the processor returns.
   * Ignore `active` so we can flip to `done` when waiting/delayed are empty.
   */
  ignoreActive?: boolean;
};

/**
 * Flip phase to `done` when listing is finished and the embed queue is empty.
 * Safe to call often (after batches, on drain, after list crawl, on activity GET).
 */
export async function maybeMarkEmbedDone(options?: MarkDoneOptions): Promise<EmbedActivityStatus> {
  const state = store();
  if (state.listCrawlInFlight) return state.status;

  const current = state.status;
  if (
    current.phase === "done" ||
    current.phase === "idle" ||
    current.phase === "error" ||
    current.phase === "waiting"
  ) {
    return current;
  }

  const counts = await starredRepoEmbedQueue.getJobCounts();
  const pending = options?.ignoreActive
    ? counts.waiting + counts.delayed
    : counts.waiting + counts.active + counts.delayed;
  if (pending > 0) return current;

  return patchEmbedActivity({
    phase: "done",
    embed: { current: null },
    message: `Done — ${current.embed.completed} embedded, ${current.embed.failed} failed`,
  });
}
