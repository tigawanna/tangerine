import {
  invalidateEnrichedRepos,
  upsertEnrichedRepo,
  type EnrichedRepoRow,
} from "@/data-access-layer/enriched/starred-enriched-collection.ts";
import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import type {
  EmbedActivitySsePayload,
  EmbedActivityStatus,
} from "@/server/elysia/routes/enrich/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { useEffect, useState } from "react";

const LIST_REFRESH_MS = 60_000;

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

  useEffect(() => {
    let cancelled = false;

    void getElysiaTreaty()
      .enrich.stream.activity.get()
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
      "/api/elysia/enrich/stream/activity/events",
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

  useEffect(() => {
    const id = window.setInterval(() => {
      void invalidateEnrichedRepos();
    }, LIST_REFRESH_MS);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  return { status, live: isLive(status) };
}
