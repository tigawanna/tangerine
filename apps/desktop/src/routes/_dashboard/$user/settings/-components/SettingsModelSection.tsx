import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getGemmaLoadStatus,
  getGemmaModelSettings,
  openGemmaPath,
  selectGemmaModel,
  type GemmaLoadStatusResult,
  type GemmaModelSettingsResult,
} from "@/data-access-layer/embeddings/embed.functions";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";

type VariantSort = "size" | "exists";

type VariantRow = GemmaModelSettingsResult["cache"]["variants"][number];

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/** Ready first, then partial downloads, then missing; tie-break by size ascending. */
function compareByExists(a: VariantRow, b: VariantRow): number {
  const rank = (v: VariantRow) => (v.ready ? 0 : v.onDiskBytes > 0 ? 1 : 2);
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  return a.approxBytes - b.approxBytes;
}

function compareBySize(a: VariantRow, b: VariantRow): number {
  return a.approxBytes - b.approxBytes;
}

function sortVariants(variants: VariantRow[], sort: VariantSort): VariantRow[] {
  const copy = [...variants];
  copy.sort(sort === "exists" ? compareByExists : compareBySize);
  return copy;
}

function variantFolder(variant: VariantRow): string {
  const first = variant.paths[0];
  if (!first) return "";
  return first.replace(/[/\\][^/\\]+$/, "") || first;
}

/** Single-line truncated path; full path on hover. */
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
    <Tooltip>
      <TooltipTrigger asChild>
        <code
          data-test={dataTest}
          className={cn(
            "block min-w-0 cursor-default truncate font-mono text-[11px] leading-relaxed text-muted-foreground",
            className,
          )}
        >
          {path}
        </code>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[min(90vw,36rem)] break-all text-left font-mono text-[11px]"
      >
        {path}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * EmbeddingGemma model picker: shows cache paths, download progress, and dtype switch.
 */
export function SettingsModelSection() {
  const [settings, setSettings] = useState<GemmaModelSettingsResult | null>(null);
  const [load, setLoad] = useState<GemmaLoadStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [sort, setSort] = useState<VariantSort>("exists");
  const [openingPath, setOpeningPath] = useState<string | null>(null);

  async function refreshSettings() {
    const next = await getGemmaModelSettings();
    setSettings(next);
    setLoad(next.load);
  }

  useEffect(() => {
    void refreshSettings().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "Failed to load model settings");
    });
  }, []);

  useEffect(() => {
    if (!switching && load?.phase !== "loading") return;

    let cancelled = false;
    const id = window.setInterval(() => {
      void getGemmaLoadStatus()
        .then((status) => {
          if (cancelled) return;
          setLoad(status);
          if (status.phase === "ready" || status.phase === "error") {
            setSwitching(false);
            void refreshSettings();
          }
        })
        .catch(() => {
          // ignore poll errors
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [switching, load?.phase]);

  async function handleSelect(dtype: GemmaModelSettingsResult["activeDtype"]) {
    if (switching) return;
    setError(null);
    setSwitching(true);
    try {
      const status = await selectGemmaModel({ data: { dtype } });
      setLoad(status);
      setSettings((prev) => (prev ? { ...prev, activeDtype: dtype, load: status } : prev));
    } catch (caught) {
      setSwitching(false);
      setError(caught instanceof Error ? caught.message : "Failed to switch model");
    }
  }

  async function handleOpen(path: string) {
    if (!path || openingPath) return;
    setError(null);
    setOpeningPath(path);
    try {
      await openGemmaPath({ data: { path } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to open folder");
    } finally {
      setOpeningPath(null);
    }
  }

  if (!settings) {
    if (error) {
      return (
        <p className="text-sm text-destructive" role="alert" data-test="settings-model-error">
          {error}
        </p>
      );
    }
    return (
      <p className="text-sm text-muted-foreground" data-test="settings-model-loading">
        Loading model settings…
      </p>
    );
  }

  const downloading = load?.phase === "loading";
  const variants = sortVariants(settings.cache.variants, sort);

  return (
    <section className="flex flex-col gap-4" data-test="settings-model-section">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Embedding model</h2>
          <p className="text-sm text-muted-foreground">
            Local EmbeddingGemma ONNX weights. Switching starts a download only when that
            variant is not already on disk.
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={sort}
          onValueChange={(value) => {
            if (value === "size" || value === "exists") setSort(value);
          }}
          data-test="settings-model-sort"
          className="shrink-0"
        >
          <ToggleGroupItem value="exists" data-test="settings-model-sort-exists">
            On disk
          </ToggleGroupItem>
          <ToggleGroupItem value="size" data-test="settings-model-sort-size">
            Size
          </ToggleGroupItem>
        </ToggleGroup>
      </header>

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
              void handleOpen(settings.cache.modelDir);
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
            </span>
            <span className="tabular-nums">{Math.round(load.progress)}%</span>
          </div>
          <Progress value={load.progress} />
        </div>
      ) : null}

      {load?.phase === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          {load.error ?? "Model load failed"}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {variants.map((variant) => {
          const selected = settings.activeDtype === variant.id;
          const isDownloadingThis = downloading && load?.dtype === variant.id;
          const folder = variantFolder(variant);

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
                    {variant.ready ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                        On disk
                      </span>
                    ) : variant.onDiskBytes > 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Partial {formatBytes(variant.onDiskBytes)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Not downloaded
                      </span>
                    )}
                    {selected ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Selected</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{variant.description}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!folder || openingPath === folder}
                    data-test={`settings-model-open-${variant.id}`}
                    onClick={() => {
                      void handleOpen(folder);
                    }}
                  >
                    <FolderOpen className="size-3.5" />
                    Open
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selected ? "secondary" : "outline"}
                    disabled={switching || (selected && load?.phase === "ready")}
                    data-test={`settings-model-select-${variant.id}`}
                    onClick={() => {
                      void handleSelect(variant.id);
                    }}
                  >
                    {isDownloadingThis
                      ? "Downloading…"
                      : selected && load?.phase === "ready"
                        ? "Selected"
                        : selected
                          ? variant.ready
                            ? "Load"
                            : "Resume"
                          : variant.ready
                            ? "Switch"
                            : "Download & use"}
                  </Button>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                {variant.paths.map((path) => (
                  <PathLine key={path} path={path} />
                ))}
                {variant.missing.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
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
