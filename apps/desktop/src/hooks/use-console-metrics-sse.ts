import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import type { ProcessMetricsSample } from "@/elysia/routes/console/sample-metrics.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { useEffect, useState } from "react";

/** Keep ~90s of 1Hz samples for the sparkline. */
const HISTORY_LIMIT = 90;

export type ConsoleMetricsPoint = ProcessMetricsSample & {
  /** Short clock label for the chart axis. */
  t: string;
};

function toPoint(sample: ProcessMetricsSample): ConsoleMetricsPoint {
  const date = new Date(sample.at);
  const t = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { ...sample, t };
}

/**
 * Live process RSS / heap / CPU via SSE for the enriched console.
 * History is capped so the chart stays light.
 */
export function useConsoleMetricsSse(enabled = true) {
  const [latest, setLatest] = useState<ConsoleMetricsPoint | null>(null);
  const [history, setHistory] = useState<ConsoleMetricsPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void getElysiaTreaty()
      .console.get()
      .then(({ data, error: requestError }) => {
        if (cancelled || requestError || !data) return;
        const point = toPoint(data);
        setLatest(point);
        setHistory([point]);
        setError(null);
      })
      .catch(() => {
        // SSE will retry / surface errors
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const path = getElysiaTreaty().console.metrics["~path"];
    return subscribeSseJson<ProcessMetricsSample>(path, {
      onMessage: (sample) => {
        const point = toPoint(sample);
        setLatest(point);
        setHistory((prev) => {
          const next = [...prev, point];
          return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
        });
        setError(null);
      },
      onError: (caught) => {
        setError(caught instanceof Error ? caught.message : "Metrics stream error");
      },
    });
  }, [enabled]);

  return { latest, history, error };
}
