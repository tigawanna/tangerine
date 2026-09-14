import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getElysiaTreaty, type ElysiaTreaty } from "@/server/elysia/treaty";
import { formatBytes } from "@/utils/format-bytes";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";

type EmbeddingModelsResponse = NonNullable<
  Awaited<ReturnType<ElysiaTreaty["embedding"]["models"]["get"]>>["data"]
>;
type VariantStatus = EmbeddingModelsResponse["models"]["variants"][number];

/**
 * Port experiment: Elysia GET + SSE tick stream via Eden Treaty.
 * Step 1 done: model/runtime inventory. Next: download + progress SSE.
 */
export function ElysiaLabPage() {
  const modelsQuery = useQuery({
    queryKey: ["elysia", "embedding", "models"],
    queryFn: async () => {
      const { data, error } = await getElysiaTreaty().embedding.models.get();
      if (error) throw new Error(String(error.value ?? error.status));
      return data;
    },
  });

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

  return (
    <LabShell fetching={modelsQuery.isFetching} onRefresh={() => void modelsQuery.refetch()}>
      <section className="flex flex-col gap-3" data-test="elysia-lab-runtime">
        <h2 className="text-sm font-medium text-muted-foreground">Runtime</h2>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={runtimeTone}>{runtime.phase}</StatusPill>
            <span className="text-xs text-muted-foreground">
              source <span className="text-foreground">{runtime.source}</span>
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatBytes(runtime.onDiskBytes)} / ~{formatBytes(runtime.approxBytes)}
            </span>
            <span className="text-xs text-muted-foreground">
              active <span className="font-medium text-foreground">{inventory.activeDtype}</span>
            </span>
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

        <ul className="flex flex-col gap-3">
          {models.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              selected={inventory.activeDtype === variant.id}
            />
          ))}
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
            Read-only inventory from the embedded Elysia API — runtime + EmbeddingGemma variants on
            disk.
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

function VariantCard({ variant, selected }: { variant: VariantStatus; selected: boolean }) {
  const path = variant.paths[0];

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border p-4",
        selected && "border-primary/60 bg-primary/5",
      )}
      data-test={`elysia-lab-variant-${variant.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{variant.label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          ~{formatBytes(variant.approxBytes)}
        </span>
        <VariantDiskPill variant={variant} />
        {selected && <StatusPill tone="accent">Selected</StatusPill>}
      </div>
      <p className="text-sm text-muted-foreground">{variant.description}</p>
      {path && <PathLine path={path} />}
      {variant.missing.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Missing <span className="font-mono text-foreground">{variant.missing.join(", ")}</span>
        </p>
      )}
    </li>
  );
}

function VariantDiskPill({ variant }: { variant: VariantStatus }) {
  if (variant.ready) {
    return <StatusPill tone="ok">On disk</StatusPill>;
  }
  if (variant.onDiskBytes > 0) {
    return (
      <StatusPill tone="muted">
        {formatBytes(variant.onDiskBytes)} / ~{formatBytes(variant.approxBytes)}
      </StatusPill>
    );
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
