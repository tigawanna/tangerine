import {
  getEmbeddingBootstrap,
  getGemmaLoadStatus,
  getGemmaModelSettings,
} from "@/data-access-layer/embeddings/embed.functions";
import { queryOptions } from "@tanstack/react-query";

export const gemmaQueryKeys = {
  all: ["gemma"] as const,
  settings: ["gemma", "settings"] as const,
  load: ["gemma", "load"] as const,
  bootstrap: ["gemma", "bootstrap"] as const,
};

/**
 * Active dtype, cache inventory, and prefs path for the settings model picker.
 */
export const gemmaModelSettingsQueryOptions = queryOptions({
  queryKey: gemmaQueryKeys.settings,
  queryFn: () => getGemmaModelSettings(),
});

/**
 * Live EmbeddingGemma load / download progress. Poll while `phase === "loading"`.
 */
export const gemmaLoadStatusQueryOptions = queryOptions({
  queryKey: gemmaQueryKeys.load,
  queryFn: () => getGemmaLoadStatus(),
});

/**
 * ORT + Q4 first-run bootstrap. Poll while overall is running.
 */
export const embeddingBootstrapQueryOptions = queryOptions({
  queryKey: gemmaQueryKeys.bootstrap,
  queryFn: () => getEmbeddingBootstrap(),
});
