import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import type { UserRepoEmbedActivityStatus } from "@/elysia/routes/enrich/repos/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type ReposEmbedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** GitHub login from `$user` — whose owned repos to crawl. */
  login: string;
  status: UserRepoEmbedActivityStatus | null;
  live: boolean;
};

type RunPages = 1 | 2 | undefined;

/**
 * Controls user-repos list crawl + embed worker. Progress comes from activity SSE.
 * Default “top 100” is one page of 100 (PUSHED_AT DESC).
 */
export function ReposEmbedDialog({
  open,
  onOpenChange,
  login,
  status,
  live,
}: ReposEmbedDialogProps) {
  const run = useMutation({
    mutationFn: async (pages: RunPages) => {
      const token = await getClientGithubAccessToken();
      const { data, error } = await getElysiaTreaty().enrich.repos.run.post({
        login,
        token,
        // Top 100 = 1 page @ default pageSize 100; omit pages for a full crawl.
        ...(pages === undefined ? {} : { pages }),
      });
      if (error) throw new Error(treatyErrorMessage(error));
      if (data && "ok" in data && data.ok === false) {
        throw new Error(data.message ?? "Repos embed failed to start");
      }
      return data;
    },
  });

  const pause = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.repos.worker.pause.post();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const resume = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().enrich.repos.worker.resume.post();
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
      <DialogContent className="sm:max-w-md" data-test="repos-embed-dialog">
        <DialogHeader>
          <DialogTitle>Embed repos for {login}</DialogTitle>
          <DialogDescription>
            Crawls @{login}’s owned repos (most starred first) and embeds each locally. “Top
            100” is one GitHub page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Phase</span>
            <span className="font-medium capitalize" data-test="repos-embed-phase">
              {phase}
              {live ? (
                <Loader2 className="ml-1.5 inline size-3.5 animate-spin text-muted-foreground" />
              ) : null}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Working on</span>
            <span className="font-mono text-xs" data-test="repos-embed-current">
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
            data-test="repos-embed-top-100"
            disabled={busy}
            onClick={() => run.mutate(1)}
          >
            Top 100
          </Button>
          <Button
            type="button"
            variant="secondary"
            data-test="repos-embed-2-pages"
            disabled={busy}
            onClick={() => run.mutate(2)}
          >
            Do 2 pages
          </Button>
          <Button
            type="button"
            variant="outline"
            data-test="repos-embed-all"
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
                data-test="repos-embed-resume"
                disabled={busy}
                onClick={() => resume.mutate()}
              >
                Resume
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                data-test="repos-embed-cancel"
                disabled={busy || !live}
                onClick={() => pause.mutate()}
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              data-test="repos-embed-redo"
              disabled={busy}
              onClick={() => run.mutate(1)}
            >
              Redo top 100
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            data-test="repos-embed-close"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
