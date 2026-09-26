import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  gemmaLoadStatusQueryOptions,
  gemmaModelSettingsQueryOptions,
} from "@/lib/embedding-gemmma/gemma-query-options";
import { settingsRouteID } from "@/routes/_dashboard/$user/settings/-components/constants.ts";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { ChevronRight, Cpu } from "lucide-react";

const routeApi = getRouteApi(settingsRouteID);

function activeStatusLabel(phase: string | undefined): string {
  if (phase === "ready") return "loaded";
  if (phase === "loading") return "downloading…";
  if (phase === "error") return "error";
  return "not loaded";
}

/**
 * Hub card: current EmbeddingGemma selection summary → opens the full model panel.
 */
export function SettingsModelNavCard() {
  const navigate = routeApi.useNavigate();
  const settingsQuery = useQuery(gemmaModelSettingsQueryOptions);
  const loadQuery = useQuery({
    ...gemmaLoadStatusQueryOptions,
    enabled: settingsQuery.isSuccess,
    initialData: settingsQuery.data?.load,
    initialDataUpdatedAt: settingsQuery.dataUpdatedAt,
  });

  const settings = settingsQuery.data;
  const load = loadQuery.data ?? settings?.load;
  const dtype = settings?.activeDtype?.toUpperCase() ?? "—";
  const status = activeStatusLabel(load?.phase);

  return (
    <button
      type="button"
      data-test="settings-nav-model"
      className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors"
      onClick={() => {
        void navigate({
          search: (prev) => ({ ...prev, section: "model" }),
          replace: true,
        });
      }}
    >
      <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
        <Cpu className="text-muted-foreground size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">Embedding model</span>
        {settingsQuery.isLoading ? (
          <Skeleton className="mt-1 h-3 w-40" />
        ) : settingsQuery.isError ? (
          <span className="text-destructive block text-xs">Couldn’t load model status</span>
        ) : (
          <span className="text-muted-foreground block text-xs" data-test="settings-nav-model-summary">
            Active {dtype} · {status}
          </span>
        )}
      </span>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </button>
  );
}
