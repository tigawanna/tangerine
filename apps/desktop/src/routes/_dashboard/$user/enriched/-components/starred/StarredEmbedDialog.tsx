import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import type { EmbedActivityStatus } from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { getClientGithubAccessToken } from "@/lib/relay/github-access-token";
import { useMutation } from "@tanstack/react-query";
import {
  InfinityIcon,
  Layers,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Trophy,
} from "lucide-react";

type StarredEmbedDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: EmbedActivityStatus | null;
  live: boolean;
};

type RunPages = 1 | 2 | undefined;

type EmbedScope = "one-page" | "two-pages" | "all" | "redo-one-page";

const WORKING_ON_MAX_CHARS = 15;

/** Caps `owner/name` so long repo slugs cannot stretch the dialog. */
function truncateRepoRef(owner: string, name: string): string {
  const full = `${owner}/${name}`;
  if (full.length <= WORKING_ON_MAX_CHARS) return full;
  return `${full.slice(0, WORKING_ON_MAX_CHARS)}…`;
}

const SCOPE_OPTIONS = [
  {
    value: "one-page",
    label: "1 page",
    description: "One GitHub page",
    pages: 1 as RunPages,
    Icon: Trophy,
  },
  {
    value: "two-pages",
    label: "2 pages",
    description: "Up to 200 starred",
    pages: 2 as RunPages,
    Icon: Layers,
  },
  {
    value: "all",
    label: "All starred",
    description: "Full starred list",
    pages: undefined as RunPages,
    Icon: InfinityIcon,
  },
  {
    value: "redo-one-page",
    label: "Redo 1 page",
    description: "Re-embed the first page",
    pages: 1 as RunPages,
    Icon: RotateCcw,
  },
] as const satisfies ReadonlyArray<{
  value: EmbedScope;
  label: string;
  description: string;
  pages: RunPages;
  Icon: typeof Trophy;
}>;

/**
 * Controls starred list crawl + embed worker. Progress comes from activity SSE.
 */
export function StarredEmbedDialog({
  open,
  onOpenChange,
  status,
  live,
}: StarredEmbedDialogProps) {
  const [scope, setScope] = useState<EmbedScope>("one-page");

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
  const selected = SCOPE_OPTIONS.find((option) => option.value === scope) ?? SCOPE_OPTIONS[0];
  const PrimaryIcon = selected.value === "redo-one-page" ? RotateCcw : Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-test="starred-embed-dialog">
        <DialogHeader>
          <DialogTitle>Embed starred repos</DialogTitle>
          <DialogDescription>
            Starts the list crawl and embed worker together. Jobs are embedded as they enqueue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
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
            <span className="text-muted-foreground shrink-0">Working on</span>
            <span
              className="font-mono text-xs"
              data-test="starred-embed-current"
              title={current ? `${current.owner}/${current.name}` : undefined}
            >
              {current ? truncateRepoRef(current.owner, current.name) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Done / failed</span>
            <span className="font-mono text-xs tabular-nums">
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="starred-embed-scope" className="text-muted-foreground text-xs font-medium">
            Scope
          </Label>
          <Select
            value={scope}
            onValueChange={(value) => setScope(value as EmbedScope)}
            disabled={busy}
          >
            <SelectTrigger
              id="starred-embed-scope"
              className="h-10 w-full"
              data-test="starred-embed-scope"
            >
              <SelectValue placeholder="Choose scope">
                <span className="flex items-center gap-2">
                  <selected.Icon className="size-4 text-muted-foreground" />
                  {selected.label}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="w-(--radix-select-trigger-width)"
            >
              {SCOPE_OPTIONS.map(({ value, label, description, Icon }) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="items-start py-2"
                  data-test={`starred-embed-scope-${value}`}
                >
                  <span className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 text-muted-foreground" />
                    <span className="flex flex-col gap-0.5">
                      <span>{label}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {description}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {waiting ? (
            <Button
              type="button"
              variant="secondary"
              data-test="starred-embed-resume"
              disabled={busy}
              onClick={() => resume.mutate()}
            >
              <Play />
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
              <Square />
              Cancel
            </Button>
          )}
          <Button
            type="button"
            data-test="starred-embed-run"
            disabled={busy}
            onClick={() => run.mutate(selected.pages)}
          >
            {run.isPending ? <Loader2 className="animate-spin" /> : <PrimaryIcon />}
            {selected.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
