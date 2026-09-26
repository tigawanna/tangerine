import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import { userRepoEmbedQueue } from "@/elysia/routes/enrich/repos/helpers/queue.ts";

export type UserRepoEmbedActivityPhase =
  | "idle"
  | "listing"
  | "embedding"
  | "waiting"
  | "done"
  | "error";

export type UserRepoEmbedActivityStatus = {
  phase: UserRepoEmbedActivityPhase;
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
export type UserRepoEmbedActivityRepoRow = {
  id: string;
  owner: string;
  name: string;
  type: "repos" | null;
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
export type UserRepoEmbedActivitySsePayload = {
  status: UserRepoEmbedActivityStatus;
  row: UserRepoEmbedActivityRepoRow | null;
};

export type UserRepoEmbedActivityPatch = {
  phase?: UserRepoEmbedActivityPhase;
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

const idleStatus = (): UserRepoEmbedActivityStatus => ({
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

const GLOBAL_KEY = "__tangerineUserRepoEmbedActivity__" as const;

type UserRepoEmbedActivityGlobal = {
  status: UserRepoEmbedActivityStatus;
  listCrawlInFlight: boolean;
};

type GlobalWithUserRepoEmbedActivity = typeof globalThis & {
  [GLOBAL_KEY]?: UserRepoEmbedActivityGlobal;
};

/** Survive Vite/HMR so SSE clients and workers share one status. */
function store(): UserRepoEmbedActivityGlobal {
  const g = globalThis as GlobalWithUserRepoEmbedActivity;
  g[GLOBAL_KEY] ??= {
    status: idleStatus(),
    listCrawlInFlight: false,
  };
  return g[GLOBAL_KEY];
}

export function getUserRepoEmbedActivityStatus(): UserRepoEmbedActivityStatus {
  return store().status;
}

function emitActivity(
  row: UserRepoEmbedActivityRepoRow | null = null,
): UserRepoEmbedActivitySsePayload {
  const payload: UserRepoEmbedActivitySsePayload = { status: store().status, row };
  pubSub.publish(PUB_SUB_TOPICS.USER_REPO_EMBED_PROGRESS, payload);
  return payload;
}

export function patchUserRepoEmbedActivity(
  partial: UserRepoEmbedActivityPatch,
  row: UserRepoEmbedActivityRepoRow | null = null,
): UserRepoEmbedActivityStatus {
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

export function resetUserRepoEmbedActivity(login: string): UserRepoEmbedActivityStatus {
  store().status = {
    ...idleStatus(),
    phase: "listing",
    login,
    message: `Starting repos crawl for ${login}…`,
  };
  emitActivity(null);
  return store().status;
}

export function beginUserRepoListCrawl(): void {
  store().listCrawlInFlight = true;
}

export function markUserRepoListCrawlSettled(): void {
  store().listCrawlInFlight = false;
}

type MarkDoneOptions = {
  ignoreActive?: boolean;
};

export async function maybeMarkUserRepoEmbedDone(
  options?: MarkDoneOptions,
): Promise<UserRepoEmbedActivityStatus> {
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

  const counts = await userRepoEmbedQueue.getJobCounts();
  const pending = options?.ignoreActive
    ? counts.waiting + counts.delayed
    : counts.waiting + counts.active + counts.delayed;
  if (pending > 0) return current;

  return patchUserRepoEmbedActivity({
    phase: "done",
    embed: { current: null },
    message: `Done — ${current.embed.completed} embedded, ${current.embed.failed} failed`,
  });
}
