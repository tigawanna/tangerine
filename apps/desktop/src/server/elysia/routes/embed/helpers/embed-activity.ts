import { EventEmitter } from "node:events";

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

interface EmbedActivityEvents {
  activity: [EmbedActivitySsePayload];
}

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

let status = idleStatus();

/** In-process bus for list/embed progress (hello SSE pattern). */
export const embedActivityEmitter = new EventEmitter<EmbedActivityEvents>();

/** Latest snapshot for GET / status. */
export function getEmbedActivityStatus(): EmbedActivityStatus {
  return status;
}

function emitActivity(row: EmbedActivityRepoRow | null = null): EmbedActivitySsePayload {
  const payload: EmbedActivitySsePayload = { status, row };
  embedActivityEmitter.emit("activity", payload);
  return payload;
}

/** Patch status and notify SSE listeners. */
export function patchEmbedActivity(
  partial: EmbedActivityPatch,
  row: EmbedActivityRepoRow | null = null,
): EmbedActivityStatus {
  status = {
    phase: partial.phase ?? status.phase,
    login: partial.login !== undefined ? partial.login : status.login,
    message: partial.message !== undefined ? partial.message : status.message,
    list: {
      after: partial.list?.after !== undefined ? partial.list.after : status.list.after,
      fetchedTotal: partial.list?.fetchedTotal ?? status.list.fetchedTotal,
      enqueuedTotal: partial.list?.enqueuedTotal ?? status.list.enqueuedTotal,
      totalCount:
        partial.list?.totalCount !== undefined ? partial.list.totalCount : status.list.totalCount,
      rateLimited: partial.list?.rateLimited ?? status.list.rateLimited,
    },
    embed: {
      current: partial.embed?.current !== undefined ? partial.embed.current : status.embed.current,
      completed: partial.embed?.completed ?? status.embed.completed,
      failed: partial.embed?.failed ?? status.embed.failed,
      lastError:
        partial.embed?.lastError !== undefined ? partial.embed.lastError : status.embed.lastError,
    },
    updatedAt: new Date().toISOString(),
  };
  emitActivity(row);
  return status;
}

/** Reset counters when starting a new crawl. */
export function resetEmbedActivity(login: string): EmbedActivityStatus {
  status = {
    ...idleStatus(),
    phase: "listing",
    login,
    message: "Starting starred-list crawl…",
  };
  emitActivity(null);
  return status;
}
