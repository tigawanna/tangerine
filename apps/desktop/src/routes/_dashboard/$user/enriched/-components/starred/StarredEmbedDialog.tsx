import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import type { EmbedActivityStatus } from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type StarredEmbedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: EmbedActivityStatus | null;
  live: boolean;
};

type RunPages = 1 | 2 | undefined;

/**
 * Controls starred list crawl + embed worker. Progress comes from activity SSE.
 */
export function StarredEmbedDialog({
  open,
  onOpenChange,
  status,
  live,
}: StarredEmbedDialogProps) {
  const run = useMutation({
    mutationFn: async (pages: RunPages) => {
      const token = await getClientGithubAccessToken();
      const { data, error } = await getElysiaTreaty().enrich.starred.run.post({
        token,
        ...(pages === undefined ? {} : { pages }),
      });
      if (error) throw new Error(treatyErrorMessage(error));
      if (data && "ok" in data && data.ok === false) {
        throw new Error(data.message ?? "Starred embed failed to start");
      }
      return data;
    },
  });

  const pause = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.starred.worker.pause.post();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const resume = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.starred.worker.resume.post();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const busy = run.isPending || pause.isPending || resume.isPending;
  const current = status?.embed.current;
  const phase = status?.phase ?? "idle";
  const waiting = phase === "waiting";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-test="starred-embed-dialog">
        <DialogHeader>
          <DialogTitle>Embed starred repos</DialogTitle>
          <DialogDescription>
            Starts the list crawl and embed worker together. Jobs are embedded as they enqueue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Phase</span>
            <span className="font-medium capitalize" data-test="starred-embed-phase">
              {phase}
              {live ? (
                <Loader2 className="ml-1.5 inline size-3.5 animate-spin text-muted-foreground" />
              ) : null}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Working on</span>
            <span className="font-mono text-xs" data-test="starred-embed-current">
              {current ? `${current.owner}/${current.name}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Done / failed</span>
            <span className="font-mono text-xs">
              {status?.embed.completed ?? 0} / {status?.embed.failed ?? 0}
            </span>
          </div>
          {status?.message ? (
            <p className="text-muted-foreground border-t border-border pt-2 text-xs">
              {status.message}
            </p>
          ) : null}
          {run.isError ? (
            <p className="text-destructive text-xs">
              {run.error instanceof Error ? run.error.message : String(run.error)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-test="starred-embed-1-page"
            disabled={busy}
            onClick={() => run.mutate(1)}
          >
            Do 1 page
          </Button>
          <Button
            type="button"
            variant="secondary"
            data-test="starred-embed-2-pages"
            disabled={busy}
            onClick={() => run.mutate(2)}
          >
            Do 2 pages
          </Button>
          <Button
            type="button"
            variant="outline"
            data-test="starred-embed-all"
            disabled={busy}
            onClick={() => run.mutate(undefined)}
          >
            Do all
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {waiting ? (
              <Button
                type="button"
                variant="secondary"
                data-test="starred-embed-resume"
                disabled={busy}
                onClick={() => resume.mutate()}
              >
                Resume
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                data-test="starred-embed-cancel"
                disabled={busy || !live}
                onClick={() => pause.mutate()}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              data-test="starred-embed-redo"
              disabled={busy}
              onClick={() => run.mutate(1)}
            >
              Redo 1 page
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            data-test="starred-embed-close"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
