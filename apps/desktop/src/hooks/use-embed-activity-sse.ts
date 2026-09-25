import {
  invalidateEnrichedRepos,
  upsertEnrichedRepo,
  type EnrichedRepoRow,
} from "@/data-access-layer/enriched/starred-enriched-collection.ts";
import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import type {
  EmbedActivitySsePayload,
  EmbedActivityStatus,
} from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { useEffect, useState } from "react";

const LIST_REFRESH_MS = 60_000;
/** While a run is live, poll activity so a missed SSE `done` cannot leave the spinner stuck. */
const LIVE_ACTIVITY_POLL_MS = 2_000;

function isLive(status: EmbedActivityStatus | null): boolean {
  return (
    status?.phase === "listing" ||
    status?.phase === "embedding" ||
    status?.phase === "waiting"
  );
}

/**
 * Live enrich crawl status via SSE, optional row upserts into the enriched collection,
 * and a 1-minute full list refetch.
 */
export function useEmbedActivitySse() {
  const [status, setStatus] = useState<EmbedActivityStatus | null>(null);
  const live = isLive(status);

  useEffect(() => {
    let cancelled = false;

    void getElysiaTreaty()
      .enrich.starred.activity.get()
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
    return subscribeSseJson<EmbedActivitySsePayload>(
      "/api/elysia/enrich/starred/activity/events",
      {
        onMessage: (payload) => {
          setStatus(payload.status);
          if (payload.row) {
            upsertEnrichedRepo(payload.row as EnrichedRepoRow);
          }
        },
      },
    );
  }, []);

  // Heal stuck "embedding" if the final SSE frame was missed (HMR, race on active counts).
  useEffect(() => {
    if (!live) return;

    const id = window.setInterval(() => {
      void getElysiaTreaty()
        .enrich.starred.activity.get()
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
      void invalidateEnrichedRepos();
    }, LIST_REFRESH_MS);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return { status, live };
}
