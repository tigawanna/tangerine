import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEmbedActivitySse } from "@/hooks/use-embed-activity-sse";
import type { EmbedActivityStatus } from "@/server/elysia/routes/enrich/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { Loader2, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function progressPercent(status: EmbedActivityStatus): number {
  const total = status.list.enqueuedTotal || status.list.totalCount || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((status.embed.completed / total) * 100));
}

function phaseLabel(phase: EmbedActivityStatus["phase"]): string {
  switch (phase) {
    case "listing":
      return "Listing stars";
    case "embedding":
      return "Embedding";
    case "waiting":
      return "Rate limited";
    case "done":
      return "Done";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
}

/**
 * Live crawl card: start enqueue, stream activity over SSE, show current repo.
 */
export function EnrichedEmbedActivityCard() {
  const { status, live } = useEmbedActivitySse();
  const [pending, setPending] = useState(false);

  async function onStartCrawl() {
    setPending(true);
    try {
      const { data, error } = await getElysiaTreaty().enrich.stream.enqueue.post({});
      if (error) throw new Error(treatyErrorMessage(error));
      toast.success("Starred embed crawl started", {
        description: data ? `${data.login} · page size ${data.pageSize}` : undefined,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to start crawl";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  const percent = status ? progressPercent(status) : 0;
  const current = status?.embed.current;

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4"
      data-test="enriched-embed-activity"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">Embed crawl</h2>
          <p className="text-xs text-muted-foreground">
            Lists starred repos, embeds README + metadata, upserts into the local corpus.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={pending || live}
          data-test="enriched-embed-start"
          onClick={() => {
            void onStartCrawl();
          }}
        >
          {pending || live ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Play className="size-4" aria-hidden />
          )}
          {live ? "Running…" : "Start crawl"}
        </Button>
      </div>

      {status ? (
        <div className="flex flex-col gap-3" data-test="enriched-embed-stats">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span data-test="enriched-embed-phase">
              Phase{" "}
              <span className="font-medium text-foreground">{phaseLabel(status.phase)}</span>
            </span>
            <span>
              Listed{" "}
              <span className="tabular-nums text-foreground">{status.list.fetchedTotal}</span>
              {status.list.totalCount != null ? (
                <span className="tabular-nums"> / {status.list.totalCount}</span>
              ) : null}
            </span>
            <span>
              Queued{" "}
              <span className="tabular-nums text-foreground">{status.list.enqueuedTotal}</span>
            </span>
            <span>
              Embedded{" "}
              <span className="tabular-nums text-foreground">{status.embed.completed}</span>
            </span>
            {status.embed.failed > 0 ? (
              <span className="text-destructive">
                Failed <span className="tabular-nums">{status.embed.failed}</span>
              </span>
            ) : null}
          </div>

          {status.message ? (
            <p className="text-sm text-foreground" data-test="enriched-embed-message">
              {status.message}
            </p>
          ) : null}

          {current ? (
            <p className="font-mono text-sm text-foreground" data-test="enriched-embed-current">
              Embedding {current.owner}/{current.name}
            </p>
          ) : null}

          {live || status.embed.completed > 0 ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <Progress value={percent} data-test="enriched-embed-progress" />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No crawl activity yet.</p>
      )}
    </section>
  );
}
