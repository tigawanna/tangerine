import { Button } from "@/components/ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import type { EvlogMaxFiles } from "@/lib/evlog/evlog-prefs.ts";
import { settingsRouteID } from "@/routes/_dashboard/$user/settings/-components/constants.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { formatBytes } from "@/utils/format-bytes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, FileText, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

const routeApi = getRouteApi(settingsRouteID);
const logsQueryKey = ["system", "logs"] as const;

/**
 * Evlog disk usage, retention, and wipe controls.
 */
export function SettingsLogsSection() {
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: logsQueryKey,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().system.logs.get();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const openPath = useMutation({
    mutationFn: async (path: string) => {
      const { data, error } = await getElysiaTreaty().system.open.post({ path });
      if (error) throw new Error(treatyErrorMessage(error));
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onError: (caught: unknown) => {
      toast.error(caught instanceof Error ? caught.message : String(caught));
    },
  });

  const retention = useMutation({
    mutationFn: async (maxFiles: EvlogMaxFiles) => {
      const { data, error } = await getElysiaTreaty().system.logs.retention.patch({
        maxFiles,
      });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: logsQueryKey });
      toast.success(data?.message ?? "Retention updated");
    },
    onError: (caught: unknown) => {
      toast.error(caught instanceof Error ? caught.message : String(caught));
    },
  });

  const wipe = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().system.logs.delete();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: logsQueryKey });
      toast.success(data?.message ?? "Logs deleted");
    },
    onError: (caught: unknown) => {
      toast.error(caught instanceof Error ? caught.message : String(caught));
    },
  });

  const files = list.data?.files ?? [];
  const options = list.data?.maxFilesOptions ?? [3, 7, 14, 30, 90];
  const maxFiles = list.data?.maxFiles ?? 14;
  const logsDir = list.data?.dir;
  const busy = openPath.isPending || retention.isPending || wipe.isPending;

  return (
    <div className="flex w-full flex-col gap-8" data-test="settings-logs">
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit px-0"
          data-test="settings-logs-back"
          onClick={() => {
            void navigate({
              search: (prev) => ({ ...prev, section: undefined }),
              replace: true,
            });
          }}
        >
          <ArrowLeft className="size-4" />
          Settings
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Logs</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Shared evlog NDJSON files. Trim retention or wipe them when disk is tight.
          </p>
        </div>
      </div>

      {list.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {list.error instanceof Error ? list.error.message : String(list.error)}
        </p>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Location</h3>
          <div className="flex items-center gap-2">
            <code
              className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-[11px]"
              data-test="settings-logs-dir"
              title={logsDir}
            >
              {logsDir ?? "…"}
            </code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-test="settings-logs-open-dir"
              disabled={busy || !logsDir}
              onClick={() => {
                if (logsDir) openPath.mutate(logsDir);
              }}
            >
              <FolderOpen className="size-3.5" />
              Open
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium">Retention</h3>
            <p className="text-muted-foreground text-xs">
              Keep the newest N daily files; older ones are deleted immediately when you change
              this.
            </p>
          </div>
          <Select
            value={String(maxFiles)}
            disabled={list.isLoading || retention.isPending}
            onValueChange={(value) => {
              const next = Number(value) as EvlogMaxFiles;
              retention.mutate(next);
            }}
          >
            <SelectTrigger className="w-40" data-test="settings-logs-retention">
              <SelectValue placeholder="Days" />
            </SelectTrigger>
            <SelectContent>
              {options.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-muted-foreground text-xs tabular-nums">
            {files.length} files · {formatBytes(list.data?.totalBytes ?? 0)}
          </p>
          <Button
            type="button"
            variant="destructive"
            data-test="settings-logs-delete-all"
            disabled={wipe.isPending || files.length === 0}
            onClick={() => {
              if (!window.confirm("Delete all local evlog files? This cannot be undone.")) {
                return;
              }
              wipe.mutate();
            }}
          >
            <Trash2 className="size-4" />
            Delete all logs
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Files</h3>
        {list.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading logs…</p>
        ) : null}
        {!list.isLoading && files.length === 0 ? (
          <p
            className="text-muted-foreground rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm"
            data-test="settings-logs-empty"
          >
            No log files yet.
          </p>
        ) : null}
        {files.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {files.map((file) => (
              <li key={file.name} className="flex items-center gap-3 px-3 py-2.5">
                <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-medium">{file.name}</p>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">{file.path}</p>
                </div>
                <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {formatBytes(file.sizeBytes)}
                </span>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  data-test={`settings-logs-open-${file.name}`}
                  disabled={busy}
                  aria-label={`Open folder for ${file.name}`}
                  onClick={() => openPath.mutate(file.path)}
                >
                  <FolderOpen className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
