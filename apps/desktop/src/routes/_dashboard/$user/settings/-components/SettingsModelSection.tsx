import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  gemmaLoadStatusQueryOptions,
  gemmaModelSettingsQueryOptions,
  gemmaQueryKeys,
} from "@/data-access-layer/embeddings/gemma-query-options";
import { useEmbeddingBootstrapSse, useGemmaLoadSse } from "@/hooks/use-embedding-sse";
import { cn } from "@/lib/utils";
import type { GemmaDtypeId, GemmaModelSettingsResult } from "@/elysia/routes/models/embedding-types.ts";
import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { unwrapUnknownError } from "@/utils/errors";
import { formatBytes } from "@/utils/format-bytes";
import { sortVariantsBySize, variantFolder } from "@/utils/gemma-model-variants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Cpu, FolderOpen, RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** Single-line truncated path (open in file explorer for the full path). */
function PathLine({
  path,
  className,
  "data-test": dataTest,
}: {
  path: string;
  className?: string;
  "data-test"?: string;
}) {
  return (
    <code
      data-test={dataTest}
      className={cn(
        "block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] leading-none text-muted-foreground",
        className,
      )}
    >
      {path}
    </code>
  );
}

/** Tiny ring + percent for in-list download progress. */
function CircularPercent({
  value,
  "data-test": dataTest,
}: {
  value: number;
  "data-test"?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="relative size-9 shrink-0"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Download ${pct}%`}
      data-test={dataTest}
    >
      <svg className="size-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r={radius} fill="none" className="stroke-muted" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          className="stroke-primary transition-[stroke-dashoffset] duration-300"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tabular-nums leading-none text-foreground">
        {pct}%
      </span>
    </div>
  );
}

function downloadSizeLabel(load: {
  loadedBytes?: number;
  totalBytes?: number;
  progress: number;
  progressSettled?: boolean;
  approxFallback?: number;
}): string | null {
  const total = load.totalBytes ?? load.approxFallback;
  if (total == null || total <= 0) return null;
  if (load.progressSettled !== true) {
    return `0 B / ${formatBytes(total)}`;
  }
  const loaded = load.loadedBytes ?? Math.round((Math.min(100, load.progress) / 100) * total);
  return `${formatBytes(loaded)} / ${formatBytes(total)}`;
}

/** Hold at 0 until the server marks the first credible HF progress sample. */
function displayProgress(load: { progress: number; progressSettled?: boolean }): number {
  return load.progressSettled === true ? load.progress : 0;
}

function ModelSectionHeader() {
  return (
    <header className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight">Embedding model</h2>
      <p className="text-sm text-muted-foreground">
        Download stores EmbeddingGemma ONNX weights on disk. Load and switch activates a variant.
      </p>
      <p className="text-xs text-muted-foreground">
        Listed smallest → largest (lowest → highest quality).
      </p>
    </header>
  );
}

function ModelSettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-test="settings-model-loading" aria-busy="true">
      <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        {["Cache", "Preference", "Active"].map((label) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="flex min-w-0 items-center gap-2">
              <Skeleton className="h-4 w-full max-w-md" />
              {label === "Cache" ? <Skeleton className="h-8 w-28 shrink-0" /> : null}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 max-w-full" />
              </div>
              <div className="flex shrink-0 gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-80 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading model settings…</p>
    </div>
  );
}

function ModelSettingsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-5"
      role="alert"
      data-test="settings-model-error"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-destructive">Couldn’t load model settings</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="pl-7">
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-test="settings-model-retry"
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}

/**
 * EmbeddingGemma model picker: download weights, then load and switch separately.
 */
export function SettingsModelSection() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery(gemmaModelSettingsQueryOptions);

  const selectMutation = useMutation({
    mutationFn: async (dtype: GemmaDtypeId) => {
      const { data, error } = await getElysiaTreaty().embedding.models.select.post({ dtype });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (status, dtype) => {
      if (!status) return;
      queryClient.setQueryData(gemmaQueryKeys.load, status);
      queryClient.setQueryData(
        gemmaQueryKeys.settings,
        (prev: GemmaModelSettingsResult | undefined) =>
          prev ? { ...prev, activeDtype: dtype, load: status } : prev,
      );
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (dtype: GemmaDtypeId) => {
      const { data, error } = await getElysiaTreaty().embedding.models.download.post({ dtype });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (status) => {
      if (!status) return;
      queryClient.setQueryData(gemmaQueryKeys.load, status);
      queryClient.setQueryData(
        gemmaQueryKeys.settings,
        (prev: GemmaModelSettingsResult | undefined) => (prev ? { ...prev, load: status } : prev),
      );
    },
  });

  const bootstrapMutation = useMutation({
    mutationFn: async (action: "start" | "cancel") => {
      const client = getElysiaTreaty().embedding.bootstrap;
      const { data, error } =
        action === "cancel" ? await client.cancel.post() : await client.resume.post();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (bootstrap) => {
      if (!bootstrap) return;
      queryClient.setQueryData(gemmaQueryKeys.bootstrap, bootstrap);
      queryClient.setQueryData(
        gemmaQueryKeys.settings,
        (prev: GemmaModelSettingsResult | undefined) => (prev ? { ...prev, bootstrap } : prev),
      );
      if (bootstrap.overall.phase === "cancelled") {
        toast.message("Embedding download cancelled");
      }
      if (bootstrap.overall.phase === "ready" || bootstrap.overall.phase === "error") {
        void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
      }
    },
  });

  const loadQuery = useQuery({
    ...gemmaLoadStatusQueryOptions,
    enabled: settingsQuery.isSuccess,
    initialData: settingsQuery.data?.load,
    initialDataUpdatedAt: settingsQuery.dataUpdatedAt,
  });

  const cancelLoadMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await getElysiaTreaty().embedding.models.cancel.post();
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
    onSuccess: (status) => {
      if (!status) return;
      queryClient.setQueryData(gemmaQueryKeys.load, status);
      queryClient.setQueryData(
        gemmaQueryKeys.settings,
        (prev: GemmaModelSettingsResult | undefined) => (prev ? { ...prev, load: status } : prev),
      );
      void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
      toast.message("Model download cancelled");
    },
  });

  const openMutation = useMutation({
    mutationFn: async (path: string) => {
      const { data, error } = await getElysiaTreaty().embedding.models.open.post({ path });
      if (error) throw new Error(treatyErrorMessage(error));
      return data;
    },
  });

  const load = loadQuery.data ?? settingsQuery.data?.load ?? null;
  const bootstrap = settingsQuery.data?.bootstrap;
  const bootstrapLive =
    bootstrap?.overall.phase === "running" ||
    bootstrap?.runtime.phase === "downloading" ||
    bootstrap?.model.phase === "downloading";
  const loadLive =
    selectMutation.isPending || downloadMutation.isPending || load?.phase === "loading";
  const busy = selectMutation.isPending || downloadMutation.isPending || load?.phase === "loading";
  const cancellingDownload = bootstrapMutation.isPending || cancelLoadMutation.isPending;

  function handleCancelDownload() {
    if (bootstrapLive) {
      bootstrapMutation.mutate("cancel");
      return;
    }
    cancelLoadMutation.mutate();
  }

  useEmbeddingBootstrapSse(Boolean(bootstrapLive));
  useGemmaLoadSse(Boolean(loadLive));

  const prevLoadPhase = useRef(load?.phase);

  useEffect(() => {
    const phase = load?.phase;
    const prev = prevLoadPhase.current;
    prevLoadPhase.current = phase;
    if (prev === "loading" && (phase === "ready" || phase === "error" || phase === "idle")) {
      void queryClient.invalidateQueries({ queryKey: gemmaQueryKeys.settings });
    }
  }, [load?.phase, queryClient]);

  const settings = settingsQuery.data;
  const openingPath = openMutation.isPending ? (openMutation.variables ?? null) : null;
  const loadError =
    settingsQuery.error != null ? unwrapUnknownError(settingsQuery.error).message : null;
  const actionError = selectMutation.error ?? downloadMutation.error ?? openMutation.error;
  const inlineError = actionError != null ? unwrapUnknownError(actionError).message : null;

  if (!settings) {
    return (
      <section className="flex flex-col gap-4" data-test="settings-model-section">
        <ModelSectionHeader />
        {loadError ? (
          <ModelSettingsError
            message={loadError}
            onRetry={() => {
              void settingsQuery.refetch();
            }}
          />
        ) : (
          <ModelSettingsSkeleton />
        )}
      </section>
    );
  }

  const downloading = load?.phase === "loading";
  const variants = sortVariantsBySize(settings.cache.variants);
  const loadSizeLabel = downloading && load ? downloadSizeLabel(load) : null;
  const loadPct = load ? displayProgress(load) : 0;

  return (
    <section className="flex flex-col gap-4" data-test="settings-model-section">
      <ModelSectionHeader />

      <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">Cache</dt>
        <dd className="flex min-w-0 items-center gap-2">
          <PathLine
            path={settings.cache.modelDir}
            className="flex-1"
            data-test="settings-model-cache-dir"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={openingPath === settings.cache.modelDir}
            data-test="settings-model-open-cache"
            onClick={() => {
              openMutation.mutate(settings.cache.modelDir);
            }}
          >
            <FolderOpen className="size-3.5" />
            Open location
          </Button>
        </dd>
        <dt className="text-muted-foreground">Preference</dt>
        <dd className="min-w-0" data-test="settings-model-prefs-path">
          <PathLine path={settings.prefsPath} />
        </dd>
        <dt className="text-muted-foreground">Active</dt>
        <dd className="font-medium" data-test="settings-model-active">
          {settings.activeDtype.toUpperCase()}
          {load?.phase === "ready" ? " · loaded" : null}
          {load?.phase === "idle" ? " · not loaded yet" : null}
        </dd>
      </dl>

      {downloading && load ? (
        <div className="flex flex-col gap-2" data-test="settings-model-progress">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">
              {load.file ? `Fetching ${load.file}` : `Downloading ${load.dtype.toUpperCase()}…`}
              {loadSizeLabel ? (
                <span className="ml-2 tabular-nums text-foreground/80">{loadSizeLabel}</span>
              ) : null}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular-nums">{Math.round(loadPct)}%</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7"
                disabled={cancellingDownload}
                data-test="settings-model-cancel-download"
                onClick={handleCancelDownload}
              >
                Cancel
              </Button>
            </div>
          </div>
          <Progress value={loadPct} />
        </div>
      ) : null}

      {load?.phase === "error" ? (
        <div
          className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
          <p className="text-destructive">{load.error ?? "Model load failed"}</p>
        </div>
      ) : null}

      {inlineError ? (
        <div
          className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
          <p className="text-destructive">{inlineError}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        <li
          className={cn(
            "flex flex-col gap-2 rounded-lg border border-border p-4",
            settings.bootstrap.runtime.phase === "ready" && "border-primary/40 bg-primary/5",
          )}
          data-test="settings-model-runtime"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Cpu className="size-4 text-muted-foreground" aria-hidden />
                <span className="font-medium">ONNX Runtime</span>
                <span className="text-xs text-muted-foreground">
                  ~{formatBytes(settings.bootstrap.runtime.approxBytes)}
                </span>
                {settings.bootstrap.runtime.phase === "ready" ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    {settings.bootstrap.runtime.source === "bundled" ? "Bundled" : "On disk"}
                  </span>
                ) : settings.bootstrap.runtime.phase === "downloading" ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Downloading {Math.round(settings.bootstrap.runtime.progress)}%
                  </span>
                ) : settings.bootstrap.runtime.phase === "cancelled" ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Cancelled
                  </span>
                ) : settings.bootstrap.runtime.phase === "error" ? (
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                    Error
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Not installed
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Native inference engine. Downloaded on first use so the app install stays small.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {settings.bootstrap.runtime.path.startsWith("/") ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={openingPath === settings.bootstrap.runtime.path}
                  data-test="settings-model-open-runtime"
                  onClick={() => {
                    openMutation.mutate(settings.bootstrap.runtime.path);
                  }}
                >
                  <FolderOpen className="size-3.5" />
                  Open
                </Button>
              ) : null}
              {settings.bootstrap.runtime.phase === "downloading" ||
              settings.bootstrap.overall.phase === "running" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bootstrapMutation.isPending}
                  data-test="settings-model-cancel-bootstrap"
                  onClick={() => {
                    bootstrapMutation.mutate("cancel");
                  }}
                >
                  Cancel
                </Button>
              ) : settings.bootstrap.runtime.phase !== "ready" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={bootstrapMutation.isPending}
                  data-test="settings-model-install-runtime"
                  onClick={() => {
                    bootstrapMutation.mutate("start");
                  }}
                >
                  {settings.bootstrap.runtime.phase === "cancelled" ||
                  settings.bootstrap.runtime.phase === "error"
                    ? "Resume"
                    : "Download"}
                </Button>
              ) : null}
            </div>
          </div>
          {settings.bootstrap.runtime.phase === "downloading" ? (
            <Progress value={settings.bootstrap.runtime.progress} />
          ) : null}
          {settings.bootstrap.runtime.error ? (
            <p className="text-xs text-destructive">{settings.bootstrap.runtime.error}</p>
          ) : null}
          <div className="min-w-0 overflow-hidden">
            <PathLine path={settings.bootstrap.runtime.path} />
          </div>
        </li>

        {variants.map((variant) => {
          const selected = settings.activeDtype === variant.id;
          const isDownloadingThis = downloading && load?.dtype === variant.id;
          const folder = variantFolder(variant);
          const loadedHere = selected && load?.phase === "ready";
          const variantSizeLabel =
            isDownloadingThis && load
              ? downloadSizeLabel({ ...load, approxFallback: variant.approxBytes })
              : null;
          const variantPct = isDownloadingThis && load ? displayProgress(load) : 0;

          return (
            <li
              key={variant.id}
              className={cn(
                "flex flex-col gap-2 rounded-lg border border-border p-4",
                selected && "border-primary/60 bg-primary/5",
              )}
              data-test={`settings-model-variant-${variant.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{variant.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ~{formatBytes(variant.approxBytes)}
                    </span>
                    {isDownloadingThis && load ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {variantSizeLabel ?? `Downloading ${Math.round(variantPct)}%`}
                      </span>
                    ) : variant.ready ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        On disk
                      </span>
                    ) : variant.onDiskBytes > 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                        {formatBytes(variant.onDiskBytes)} / ~{formatBytes(variant.approxBytes)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Not downloaded
                      </span>
                    )}
                    {selected ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{variant.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isDownloadingThis && load ? (
                    <CircularPercent
                      value={variantPct}
                      data-test={`settings-model-progress-${variant.id}`}
                    />
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!folder || openingPath === folder}
                    data-test={`settings-model-open-${variant.id}`}
                    onClick={() => {
                      openMutation.mutate(folder);
                    }}
                  >
                    <FolderOpen className="size-3.5" />
                    Open
                  </Button>
                  {isDownloadingThis ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={cancellingDownload}
                      data-test={`settings-model-cancel-${variant.id}`}
                      onClick={handleCancelDownload}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <>
                      {!variant.ready ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          data-test={`settings-model-download-${variant.id}`}
                          onClick={() => {
                            downloadMutation.mutate(variant.id);
                          }}
                        >
                          Download
                        </Button>
                      ) : null}
                      {variant.ready ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={selected ? "secondary" : "outline"}
                          disabled={busy || loadedHere}
                          data-test={`settings-model-select-${variant.id}`}
                          onClick={() => {
                            selectMutation.mutate(variant.id);
                          }}
                        >
                          {loadedHere ? "Selected" : "Load and switch"}
                        </Button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div className="min-w-0 overflow-hidden">
                {folder ? <PathLine path={folder} /> : null}
                {variant.missing.length > 0 ? (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    Missing: {variant.missing.join(", ")}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
