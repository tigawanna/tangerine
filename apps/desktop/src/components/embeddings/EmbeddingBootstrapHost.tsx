import { Progress } from "@/components/ui/progress";
import {
  cancelEmbeddingBootstrapFn,
  startEmbeddingBootstrapFn,
} from "@/data-access-layer/embeddings/embed.functions";
import {
  embeddingBootstrapQueryOptions,
  gemmaQueryKeys,
} from "@/data-access-layer/embeddings/gemma-query-options";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const TOAST_ID = "embedding-bootstrap";

/**
 * Android Studio–style first-load prefetch: ORT runtime + Q4 model.
 * Sticky toast with progress + Cancel; quiet when everything is already ready.
 */
export function EmbeddingBootstrapHost() {
  const queryClient = useQueryClient();
  const started = useRef(false);
  const wasRunning = useRef(false);

  const bootstrapQuery = useQuery({
    ...embeddingBootstrapQueryOptions,
    refetchInterval: (query) => {
      const phase = query.state.data?.overall.phase;
      if (phase === "running") return 400;
      return false;
    },
  });

  const status = bootstrapQuery.data;

  useEffect(() => {
    if (!status?.shouldAutoStart || started.current) return;
    started.current = true;
    void startEmbeddingBootstrapFn()
      .then((next) => {
        queryClient.setQueryData(gemmaQueryKeys.bootstrap, next);
      })
      .catch(() => {
        started.current = false;
      });
  }, [status?.shouldAutoStart, queryClient]);

  useEffect(() => {
    if (!status) return;

    const { overall } = status;
    if (overall.phase === "running") {
      wasRunning.current = true;
      toast.loading(overall.label, {
        id: TOAST_ID,
        description: (
          <div className="mt-2 flex w-56 flex-col gap-1.5">
            <Progress value={overall.progress} className="h-1.5" />
            <span className="tabular-nums text-[11px] text-muted-foreground">
              {overall.progress}%
              {status.runtime.phase === "downloading"
                ? " · runtime"
                : status.model.phase === "downloading"
                  ? " · Q4 model"
                  : null}
            </span>
          </div>
        ),
        duration: Infinity,
        action: {
          label: "Cancel",
          onClick: () => {
            void cancelEmbeddingBootstrapFn().then((next) => {
              queryClient.setQueryData(gemmaQueryKeys.bootstrap, next);
              void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
              toast.dismiss(TOAST_ID);
              toast.message("Embedding download cancelled", {
                description: "You can resume anytime from Settings → Embedding model.",
              });
            });
          },
        },
      });
      return;
    }

    if (!wasRunning.current) return;

    if (overall.phase === "ready") {
      wasRunning.current = false;
      toast.success("Embedding components ready", {
        id: TOAST_ID,
        description: "ONNX Runtime and Q4 model are on disk.",
      });
      void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
      return;
    }

    if (overall.phase === "error") {
      wasRunning.current = false;
      toast.error("Embedding download failed", {
        id: TOAST_ID,
        description: overall.label,
      });
    }
  }, [status, queryClient]);

  return null;
}
