import { Button } from "@/components/ui/button.tsx";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { formatBytes } from "@/utils/format-bytes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";

const sqliteQueryKey = ["system", "sqlite"] as const;

/**
 * Conveyor SQLite DB inventory with reveal-in-folder + per-file delete.
 */
export function SqliteDatabasesSection() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: sqliteQueryKey,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().system.sqlite.get();
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

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await getElysiaTreaty().system.sqlite.delete.post({
        id,
      });
      if (error) throw new Error(treatyErrorMessage(error));
      if (data && "ok" in data && data.ok === false) {
        throw new Error(data.message ?? "Delete failed");
      }
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: sqliteQueryKey });
      toast.success(data && "message" in data ? data.message : "Database deleted");
    },
    onError: (caught: unknown) => {
      toast.error(caught instanceof Error ? caught.message : String(caught));
    },
  });

  const files = list.data?.files ?? [];
  const busy = openPath.isPending || remove.isPending;

  return (
    <section className="flex flex-col gap-3" data-test="settings-sqlite-section">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">SQLite databases</h3>
          <p className="text-muted-foreground text-xs">
            Conveyor queue files under the desktop config dir. Deleting may require an app
            restart if a worker still holds the file.
          </p>
        </div>
        {list.data ? (
          <p className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
            {formatBytes(list.data.totalBytes)}
          </p>
        ) : null}
      </div>

      {list.isError ? (
        <p className="text-destructive text-sm" role="alert">
          {list.error instanceof Error ? list.error.message : String(list.error)}
        </p>
      ) : null}

      {list.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading databases…</p>
      ) : null}

      {!list.isLoading && files.length === 0 ? (
        <p
          className="text-muted-foreground rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm"
          data-test="settings-sqlite-empty"
        >
          No queue databases on disk yet.
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 px-3 py-2.5"
              data-test={`settings-sqlite-row-${file.id}`}
            >
              <Database className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-medium">{file.label}</p>
                <p className="text-muted-foreground truncate font-mono text-[11px]">{file.path}</p>
              </div>
              <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                {formatBytes(file.sizeBytes)}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                data-test={`settings-sqlite-open-${file.id}`}
                disabled={busy}
                aria-label={`Open folder for ${file.label}`}
                onClick={() => openPath.mutate(file.path)}
              >
                <FolderOpen className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                data-test={`settings-sqlite-delete-${file.id}`}
                disabled={busy}
                aria-label={`Delete ${file.label}`}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Delete ${file.label}? In-flight embed jobs using this queue will fail until restart.`,
                    )
                  ) {
                    return;
                  }
                  remove.mutate(file.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
