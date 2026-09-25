import { getElysiaTreaty } from "@/elysia/treaty";
import { treatyErrorMessage } from "@/elysia/treaty-error";
import { queryOptions } from "@tanstack/react-query";

export const gemmaQueryKeys = {
  all: ["gemma"] as const,
  settings: ["gemma", "settings"] as const,
  load: ["gemma", "load"] as const,
  bootstrap: ["gemma", "bootstrap"] as const,
};

async function fetchSettings() {
  const { data, error } = await getElysiaTreaty().embedding.settings.get();
  if (error) throw new Error(treatyErrorMessage(error));
  return data;
}

async function fetchLoad() {
  const { data, error } = await getElysiaTreaty().embedding.models.load.get();
  if (error) throw new Error(treatyErrorMessage(error));
  return data;
}

async function fetchBootstrap() {
  const { data, error } = await getElysiaTreaty().embedding.bootstrap.get();
  if (error) throw new Error(treatyErrorMessage(error));
  return data;
}

/**
 * Active dtype, cache inventory, prefs path, and bootstrap for the settings model picker.
 */
export const gemmaModelSettingsQueryOptions = queryOptions({
  queryKey: gemmaQueryKeys.settings,
  queryFn: fetchSettings,
});

/**
 * Live EmbeddingGemma load / download progress (one-shot).
 * Live updates: SSE `/api/elysia/embedding/models/events` via `useGemmaLoadSse`.
 */
export const gemmaLoadStatusQueryOptions = queryOptions({
  queryKey: gemmaQueryKeys.load,
  queryFn: fetchLoad,
});

/**
 * ORT + Q4 first-run bootstrap status (one-shot).
 * Live updates: SSE `/api/elysia/embedding/bootstrap/events` via `useEmbeddingBootstrapSse`.
 */
export const embeddingBootstrapQueryOptions = queryOptions({
  queryKey: gemmaQueryKeys.bootstrap,
  queryFn: fetchBootstrap,
});
