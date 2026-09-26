import {
  invalidateEnrichedUserRepos,
  upsertEnrichedUserRepo,
  type EnrichedUserRepoRow,
} from "@/data-access-layer/enriched/repos-enriched-collection.ts";
import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import type {
  UserRepoEmbedActivitySsePayload,
  UserRepoEmbedActivityStatus,
} from "@/elysia/routes/enrich/repos/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { useEffect, useState } from "react";

const LIST_REFRESH_MS = 60_000;
const LIVE_ACTIVITY_POLL_MS = 2_000;

function isLive(status: UserRepoEmbedActivityStatus | null): boolean {
  return (
    status?.phase === "listing" ||
    status?.phase === "embedding" ||
    status?.phase === "waiting"
  );
}

/**
 * Live user-repos enrich crawl status via SSE, optional row upserts into the
 * enriched collection, and a 1-minute full list refetch.
 */
export function useUserReposEmbedActivitySse() {
  const [status, setStatus] = useState<UserRepoEmbedActivityStatus | null>(null);
  const live = isLive(status);

  useEffect(() => {
    let cancelled = false;

    void getElysiaTreaty()
      .enrich.repos.activity.get()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setStatus(data);
      })
      .catch(() => {
        // ignore cold-start
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeSseJson<UserRepoEmbedActivitySsePayload>(
      "/api/elysia/enrich/repos/activity/events",
      {
        onMessage: (payload) => {
          setStatus(payload.status);
          if (payload.row) {
            upsertEnrichedUserRepo(payload.row as EnrichedUserRepoRow);
          }
        },
      },
    );
  }, []);

  useEffect(() => {
    if (!live) return;

    const id = window.setInterval(() => {
      void getElysiaTreaty()
        .enrich.repos.activity.get()
        .then(({ data, error }) => {
          if (error || !data) return;
          setStatus(data);
        })
        .catch(() => {
          // ignore transient poll failures
        });
    }, LIVE_ACTIVITY_POLL_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [live]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void invalidateEnrichedUserRepos();
    }, LIST_REFRESH_MS);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return { status, live };
}
