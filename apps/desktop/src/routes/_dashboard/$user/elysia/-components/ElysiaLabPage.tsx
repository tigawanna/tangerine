import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { subscribeSseJson } from "@/hooks/use-embedding-sse";
import { cn } from "@/lib/utils";
import { getElysiaTreaty, type ElysiaTreaty } from "@/server/elysia/treaty";
import { treatyErrorMessage } from "@/server/elysia/treaty-error";
import { formatBytes } from "@/utils/format-bytes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, RefreshCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type EmbeddingModelsResponse = NonNullable<
  Awaited<ReturnType<ElysiaTreaty["embedding"]["models"]["get"]>>["data"]
>;
type VariantStatus = EmbeddingModelsResponse["models"]["variants"][number];
type LoadSnapshot = NonNullable<
  Awaited<ReturnType<ElysiaTreaty["embedding"]["models"]["download"]["post"]>>["data"]
>;
type DtypeId = VariantStatus["id"];

const modelsQueryKey = ["elysia", "embedding", "models"] as const;
const LOAD_EVENTS_URL = "/api/elysia/embedding/models/events";

/**
 * Port experiment: Elysia inventory + download/load with SSE progress.
 */
export function ElysiaLabPage() {
  const queryClient = useQueryClient();
  const [load, setLoad] = useState<LoadSnapshot | null>(null);

  const modelsQuery = useQuery({
    queryKey: modelsQueryKey,
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().embedding.models.get();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const loadLive = load?.phase === "loading";

  useEffect(() => {
    if (!loadLive) return;

    return subscribeSseJson<LoadSnapshot>(LOAD_EVENTS_URL, {
      onMessage: (status) => {
        setLoad(status);
        if (status.phase === "loading") return;
        void queryClient.invalidateQueries({ queryKey: modelsQueryKey });
      },
      onError: () => {
        void queryClient.invalidateQueries({ queryKey: modelsQueryKey });
      },
    });
  }, [loadLive, queryClient]);

  const downloadMutation = useMutation({
    mutationFn: async (dtype: DtypeId) => {
      const { data, error } = await getElysiaTreaty().embedding.models.download.post({ dtype });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (status) => {
      if (status) setLoad(status);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().embedding.models.cancel.post();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (status) => {
      if (status) setLoad(status);
      void queryClient.invalidateQueries({ queryKey: modelsQueryKey });
    },
  });

  const selectMutation = useMutation({
    mutationFn: async (dtype: DtypeId) => {
      const { data, error } = await getElysiaTreaty().embedding.models.select.post({ dtype });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (status) => {
      if (status) setLoad(status);
    },
  });

  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const openMutation = useMutation({
    mutationFn: async (path: string) => {
      setOpeningPath(path);
      const { data, error } = await getElysiaTreaty().embedding.models.open.post({ path });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSettled: () => {
      setOpeningPath(null);
    },
  });

  const busy =
    downloadMutation.isPending ||
    cancelMutation.isPending ||
    selectMutation.isPending ||
    load?.phase === "loading";

  if (modelsQuery.isPending) {
    return (
      <LabShell fetching={modelsQuery.isFetching} onRefresh={() => void modelsQuery.refetch()}>
        <p className="text-sm text-muted-foreground" data-test="elysia-lab-loading">
          Loading inventory…
        </p>
      </LabShell>
    );
  }

  if (modelsQuery.isError) {
    const message =
      modelsQuery.error instanceof Error
        ? modelsQuery.error.message
        : "Failed to load embedding inventory.";
    return (
      <LabShell fetching={modelsQuery.isFetching} onRefresh={() => void modelsQuery.refetch()}>
        <p className="text-sm text-destructive" role="alert" data-test="elysia-lab-error">
          {message}
        </p>
      </LabShell>
    );
  }

  const inventory = modelsQuery.data;
  if (!inventory?.models || !inventory.runtime) {
    return (
      <LabShell fetching={modelsQuery.isFetching} onRefresh={() => void modelsQuery.refetch()}>
        <p className="text-sm text-muted-foreground">No inventory returned.</p>
      </LabShell>
    );
  }

  const { models, runtime } = inventory;
  const runtimeTone = runtime.phase === "ready" ? "ok" : "muted";
  const activeDtype = inventory.activeDtype;
  const actionError =
    downloadMutation.error ??
    cancelMutation.error ??
    selectMutation.error ??
    openMutation.error ??
    null;

  return (
    <LabShell fetching={modelsQuery.isFetching} onRefresh={() => void modelsQuery.refetch()}>
      <section className="flex flex-col gap-3" data-test="elysia-lab-runtime">
        <h2 className="text-sm font-medium text-muted-foreground">Runtime</h2>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusPill tone={runtimeTone}>{runtime.phase}</StatusPill>
              <span className="text-xs text-muted-foreground">
                source <span className="text-foreground">{runtime.source}</span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatBytes(runtime.onDiskBytes)} / ~{formatBytes(runtime.approxBytes)}
              </span>
              <span className="text-xs text-muted-foreground">
                active <span className="font-medium text-foreground">{activeDtype}</span>
              </span>
            </div>
            {runtime.path.startsWith("/") && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={openingPath === runtime.path}
                data-test="elysia-lab-open-runtime"
                onClick={() => openMutation.mutate(runtime.path)}
              >
                <FolderOpen className="size-3.5" aria-hidden />
                Open
              </Button>
            )}
          </div>
          <PathLine path={runtime.path} />
          {runtime.error && <p className="text-xs text-destructive">{runtime.error}</p>}
        </div>
      </section>

      <section className="flex flex-col gap-3" data-test="elysia-lab-models">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Models</h2>
          <p className="truncate font-mono text-xs text-muted-foreground" title={models.hfModelId}>
            {models.hfModelId}
          </p>
        </div>

        {actionError && (
          <p className="text-sm text-destructive" role="alert">
            {actionError instanceof Error ? actionError.message : "Action failed."}
          </p>
        )}
        {load?.phase === "error" && load.error && (
          <p className="text-sm text-destructive" role="alert" data-test="elysia-lab-load-error">
            {load.error}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {models.variants.map((variant) => {
            const folder = variantFolder(variant);
            return (
              <VariantCard
                key={variant.id}
                variant={variant}
                selected={activeDtype === variant.id}
                load={load}
                busy={busy}
                cancelling={cancelMutation.isPending}
                opening={openingPath === folder}
                onDownload={() => downloadMutation.mutate(variant.id)}
                onCancel={() => cancelMutation.mutate()}
                onSelect={() => selectMutation.mutate(variant.id)}
                onOpen={() => {
                  if (folder) openMutation.mutate(folder);
                }}
              />
            );
          })}
        </ul>

        <p className="truncate font-mono text-xs text-muted-foreground" title={models.cacheRoot}>
          cache {models.cacheRoot}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          fetched {new Date(inventory.at).toLocaleString()}
        </p>
      </section>
    </LabShell>
  );
}

function LabShell({
  fetching,
  onRefresh,
  children,
}: {
  fetching: boolean;
  onRefresh: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-8" data-test="elysia-lab-page">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Elysia Lab</h1>
          <p className="text-sm text-muted-foreground">
            Embedded Elysia API — download EmbeddingGemma variants, watch SSE progress, then load.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={fetching}
          data-test="elysia-lab-refresh"
          aria-label="Refresh inventory"
          onClick={onRefresh}
        >
          <RefreshCcw className={cn("size-4", fetching && "animate-spin")} aria-hidden />
        </Button>
      </header>
      {children}
    </div>
  );
}

function VariantCard({
  variant,
  selected,
  load,
  busy,
  cancelling,
  opening,
  onDownload,
  onCancel,
  onSelect,
  onOpen,
}: {
  variant: VariantStatus;
  selected: boolean;
  load: LoadSnapshot | null;
  busy: boolean;
  cancelling: boolean;
  opening: boolean;
  onDownload: () => void;
  onCancel: () => void;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const path = variant.paths[0];
  const folder = variantFolder(variant);
  const activeOnThis = load?.phase === "loading" && load.dtype === variant.id;
  const progress = activeOnThis ? displayProgress(load) : 0;
  const loadedHere = selected && load?.phase === "ready" && load.dtype === variant.id;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border p-4",
        selected && "border-primary/60 bg-primary/5",
      )}
      data-test={`elysia-lab-variant-${variant.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{variant.label}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              ~{formatBytes(variant.approxBytes)}
            </span>
            <VariantDiskPill variant={variant} activeOnThis={activeOnThis} progress={progress} />
            {selected && <StatusPill tone="accent">Selected</StatusPill>}
          </div>
          <p className="text-sm text-muted-foreground">{variant.description}</p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {folder && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={opening}
              data-test={`elysia-lab-open-${variant.id}`}
              onClick={onOpen}
            >
              <FolderOpen className="size-3.5" aria-hidden />
              Open
            </Button>
          )}

          {activeOnThis && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={cancelling}
              data-test={`elysia-lab-cancel-${variant.id}`}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          {!variant.ready && !activeOnThis && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              data-test={`elysia-lab-download-${variant.id}`}
              onClick={onDownload}
            >
              Download
            </Button>
          )}

          {variant.ready && (
            <Button
              type="button"
              size="sm"
              variant={selected ? "secondary" : "outline"}
              disabled={busy || loadedHere}
              data-test={`elysia-lab-select-${variant.id}`}
              onClick={onSelect}
            >
              {loadedHere ? "Loaded" : "Load and switch"}
            </Button>
          )}
        </div>
      </div>

      {activeOnThis && (
        <div className="flex flex-col gap-2" data-test={`elysia-lab-progress-${variant.id}`}>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">
              {load.file ? `Fetching ${load.file}` : "Downloading model weights…"}
            </span>
            <span className="shrink-0 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {path && <PathLine path={path} />}
      {variant.missing.length > 0 && !activeOnThis && (
        <p className="text-xs text-muted-foreground">
          Missing <span className="font-mono text-foreground">{variant.missing.join(", ")}</span>
        </p>
      )}
    </li>
  );
}

/** Parent directory of the first on-disk path for a variant. */
function variantFolder(variant: VariantStatus): string {
  const first = variant.paths[0];
  if (!first) return "";
  return first.replace(/[/\\][^/\\]+$/, "") || first;
}

function displayProgress(load: LoadSnapshot): number {
  if (load.progressSettled === false) return 0;
  return Math.min(100, Math.max(0, load.progress));
}

function VariantDiskPill({
  variant,
  activeOnThis,
  progress,
}: {
  variant: VariantStatus;
  activeOnThis: boolean;
  progress: number;
}) {
  if (activeOnThis) {
    return <StatusPill tone="muted">Downloading {Math.round(progress)}%</StatusPill>;
  }
  if (variant.ready) {
    return <StatusPill tone="ok">On disk</StatusPill>;
  }
  return <StatusPill tone="muted">Not downloaded</StatusPill>;
}

function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "muted" | "accent";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        tone === "ok" && "bg-primary/15 text-primary",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "accent" && "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

function PathLine({ path }: { path: string }) {
  return (
    <p className="truncate font-mono text-xs text-muted-foreground" title={path}>
      {path}
    </p>
  );
}
