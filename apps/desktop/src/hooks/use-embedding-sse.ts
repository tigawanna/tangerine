import type {
  EmbeddingBootstrapStatus,
  GemmaLoadStatusResult,
  GemmaModelSettingsResult,
} from "@/elysia/routes/models/embedding-types.ts";
import { gemmaQueryKeys } from "@/data-access-layer/embeddings/gemma-query-options";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type SseHandlers<T> = {
  onMessage: (data: T) => void;
  onError?: (error: unknown) => void;
};

/**
 * Subscribe to a same-origin SSE endpoint until the connection closes.
 * Returns an unsubscribe function.
 */
export function subscribeSseJson<T>(url: string, handlers: SseHandlers<T>): () => void {
  const source = new EventSource(url);

  source.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data as string) as T & { error?: string };
      if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
        handlers.onError?.(new Error(parsed.error));
        source.close();
        return;
      }
      handlers.onMessage(parsed);
    } catch (caught) {
      handlers.onError?.(caught);
    }
  };

  source.onerror = () => {
    if (source.readyState !== EventSource.CONNECTING) {
      source.close();
    }
  };

  return () => {
    source.close();
  };
}

/**
 * Keep TanStack Query bootstrap + settings caches in sync via SSE while live.
 */
export function useEmbeddingBootstrapSse(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    return subscribeSseJson<EmbeddingBootstrapStatus>(
      "/api/elysia/embedding/bootstrap/events",
      {
        onMessage: (status) => {
          queryClient.setQueryData(gemmaQueryKeys.bootstrap, status);
          queryClient.setQueryData(
            gemmaQueryKeys.settings,
            (prev: GemmaModelSettingsResult | undefined) =>
              prev ? { ...prev, bootstrap: status } : prev,
          );
          if (
            status.overall.phase === "ready" ||
            status.overall.phase === "error" ||
            status.overall.phase === "cancelled"
          ) {
            void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
          }
        },
      },
    );
  }, [enabled, queryClient]);
}

/**
 * Stream Gemma load progress into the query cache while a download/load is active.
 */
export function useGemmaLoadSse(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    return subscribeSseJson<GemmaLoadStatusResult>("/api/elysia/embedding/models/events", {
      onMessage: (status) => {
        queryClient.setQueryData(gemmaQueryKeys.load, status);
        queryClient.setQueryData(
          gemmaQueryKeys.settings,
          (prev: GemmaModelSettingsResult | undefined) => (prev ? { ...prev, load: status } : prev),
        );
        if (status.phase === "ready" || status.phase === "error") {
          void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
        }
      },
    });
  }, [enabled, queryClient]);
}
