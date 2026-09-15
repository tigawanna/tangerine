import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import type { DemoBatchStatus } from "@/server/elysia/routes/worker/types";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { Loader2, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function isLive(status: DemoBatchStatus | null): boolean {
  return status?.phase === "running" || status?.phase === "waiting";
}

function progressPercent(status: DemoBatchStatus): number {
  if (status.total <= 0) return 0;
  return Math.min(100, Math.round((status.completed / status.total) * 100));
}

/**
 * Enqueue the Conveyor demo batch and stream progress over SSE.
 */
export function EmbedDemoBatchSection() {
  const [status, setStatus] = useState<DemoBatchStatus | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getElysiaTreaty()
      .worker["demo-batch"].get()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setStatus(data);
      })
      .catch(() => {
        // ignore cold-start fetch errors
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLive(status)) return;

    let lastWaitKey: string | null = null;

    return subscribeSseJson<DemoBatchStatus>("/api/elysia/worker/demo-batch/events", {
      onMessage: (next) => {
        if (next.phase === "waiting" && next.waitingUntil && next.waitingUntil !== lastWaitKey) {
          lastWaitKey = next.waitingUntil;
          toast.warning("Rate limited (429)", {
            description:
              next.message ??
              `Task ${next.lastTask ?? "?"} paused until ${new Date(next.waitingUntil).toLocaleTimeString()}`,
            duration: 8_000,
          });
        }
        setStatus(next);
      },
    });
  }, [status?.phase, status?.jobId]);

  async function onRunDemoBatch() {
    setPending(true);
    try {
      const { data, error } = await getElysiaTreaty().worker["demo-batch"].post({});
      if (error) throw new Error(treatyErrorMessage(error));
      if (data?.status) setStatus(data.status);
      toast.success("Demo batch enqueued", {
        description: data ? `job ${data.jobId} · ${data.total} items` : undefined,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to enqueue demo batch";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  const live = isLive(status);
  const percent = status ? progressPercent(status) : 0;

  return (
    <section
      className="flex flex-col gap-4 border-t border-border pt-6"
      data-test="embed-demo-batch-section"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium tracking-tight">Worker demo</h2>
        <p className="text-sm text-muted-foreground">
          Conveyor batch of 1000 tasks (10 at a time). Random 429s pause 20s then retry — progress
          streams over SSE.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending || live}
          data-test="embed-demo-batch-run"
          onClick={() => void onRunDemoBatch()}
        >
          {pending || live ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {live ? "Running…" : pending ? "Enqueueing…" : "Run demo batch"}
        </Button>

        {status && status.phase !== "idle" ? (
          <span
            className="text-xs tabular-nums text-muted-foreground"
            data-test="embed-demo-batch-meta"
          >
            {status.completed.toLocaleString()} / {status.total.toLocaleString()}
            {status.phase === "waiting" ? " · rate limited" : null}
            {status.phase === "done" ? " · done" : null}
            {status.phase === "error" ? " · error" : null}
          </span>
        ) : null}
      </div>

      {status && status.phase !== "idle" ? (
        <div className="flex flex-col gap-2" data-test="embed-demo-batch-progress">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">{status.message ?? status.phase}</span>
            <span className="shrink-0 tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} />
          {status.phase === "waiting" && status.waitingUntil ? (
            <p className="text-xs text-muted-foreground" data-test="embed-demo-batch-wait">
              Waiting until {new Date(status.waitingUntil).toLocaleTimeString()}
            </p>
          ) : null}
          {status.error ? (
            <p className="text-sm text-destructive" role="alert">
              {status.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
