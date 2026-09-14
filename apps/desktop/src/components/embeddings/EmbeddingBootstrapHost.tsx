import { Progress } from "@/components/ui/progress";
import {
  embeddingBootstrapQueryOptions,
  gemmaQueryKeys,
} from "@/data-access-layer/embeddings/gemma-query-options";
import { useEmbeddingBootstrapSse } from "@/hooks/use-embedding-sse";
import type { EmbeddingBootstrapStatus } from "@/server/elysia/embedding-types";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const TOAST_ID = "embedding-bootstrap";

function isBootstrapLive(status: EmbeddingBootstrapStatus | undefined): boolean {
  if (!status) return false;
  return (
    status.overall.phase === "running" ||
    status.runtime.phase === "downloading" ||
    status.model.phase === "downloading"
  );
}

/**
 * Android Studio–style first-load prefetch: ORT runtime + Q4 model.
 * Progress via SSE (`/api/elysia/embedding/bootstrap/events`); Cancel via POST.
 */
export function EmbeddingBootstrapHost() {
  const queryClient = useQueryClient();
  const started = useRef(false);
  const wasRunning = useRef(false);
  const [watchSse, setWatchSse] = useState(false);

  const bootstrapQuery = useQuery(embeddingBootstrapQueryOptions);
  const status = bootstrapQuery.data;
  const live = isBootstrapLive(status);

  useEmbeddingBootstrapSse(live || watchSse);

  useEffect(() => {
    if (!live && status && status.overall.phase !== "idle") {
      setWatchSse(false);
    }
  }, [live, status]);

  useEffect(() => {
    if (!status?.shouldAutoStart || started.current) return;
    started.current = true;
    setWatchSse(true);
    void getElysiaTreaty()
      .embedding.bootstrap.start.post()
      .then(({ data, error }) => {
        if (error) throw new Error(treatyErrorMessage(error));
        if (data) queryClient.setQueryData(gemmaQueryKeys.bootstrap, data);
      })
      .catch(() => {
        started.current = false;
        setWatchSse(false);
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
            void getElysiaTreaty()
              .embedding.bootstrap.cancel.post()
              .then(({ data, error }) => {
                if (error) throw new Error(treatyErrorMessage(error));
                if (data) queryClient.setQueryData(gemmaQueryKeys.bootstrap, data);
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
        duration: 8_000,
        action: {
          label: "OK",
          onClick: () => {
            toast.dismiss(TOAST_ID);
          },
        },
      });
      void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
      return;
    }

    if (overall.phase === "error") {
      wasRunning.current = false;
      toast.error("Embedding download failed", {
        id: TOAST_ID,
        description: overall.label,
        duration: Infinity,
        action: {
          label: "OK",
          onClick: () => {
            toast.dismiss(TOAST_ID);
          },
        },
      });
    }
  }, [status, queryClient]);

  return null;
}
