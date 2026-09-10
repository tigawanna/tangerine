import { GemmaEmbedding } from "@kessler/gemma-embedding";
import { inspectGemmaCache, type GemmaCacheInventory } from "./cache.js";
import {
  DEFAULT_GEMMA_DTYPE,
  isGemmaDtypeId,
  type GemmaDtypeId,
} from "./catalog.js";
import { EMBEDDING_MODEL_ID } from "./constants.js";
import { resolveServerGemmaOptions } from "./server-options.js";
import type { GemmaEmbeddingOptions, ProgressInfo } from "./types.js";

export type { DeviceType, EmbedMode, GemmaEmbeddingOptions, ProgressInfo } from "./types.js";
export { EMBEDDING_MODEL_ID } from "./constants.js";
export { resolveServerGemmaOptions } from "./server-options.js";
export {
  DEFAULT_GEMMA_DTYPE,
  GEMMA_DTYPE_OPTIONS,
  GEMMA_HF_MODEL_ID,
  getGemmaDtypeOption,
  isGemmaDtypeId,
  type GemmaDtypeId,
  type GemmaDtypeOption,
} from "./catalog.js";
export {
  getGemmaModelCacheDir,
  getTransformersCacheRoot,
  inspectGemmaCache,
  type GemmaCachedVariant,
  type GemmaCacheInventory,
} from "./cache.js";

export type GemmaLoadSnapshot = {
  phase: "idle" | "loading" | "ready" | "error";
  /** 0–100 while downloading / loading weights. */
  progress: number;
  file?: string;
  error?: string;
  /** Dtype the snapshot refers to (active selection). */
  dtype: GemmaDtypeId;
};

let embeddingInstance: GemmaEmbedding | null = null;
let embeddingLoadPromise: Promise<void> | null = null;
let activeDtype: GemmaDtypeId = resolveInitialDtype();
let loadSnapshot: GemmaLoadSnapshot = {
  phase: "idle",
  progress: 0,
  dtype: activeDtype,
};

function resolveInitialDtype(): GemmaDtypeId {
  const fromEnv = process.env.GEMMA_DTYPE?.trim();
  if (fromEnv && isGemmaDtypeId(fromEnv)) return fromEnv;
  return DEFAULT_GEMMA_DTYPE;
}

/** Currently selected EmbeddingGemma quantization. */
export function getActiveGemmaDtype(): GemmaDtypeId {
  return activeDtype;
}

/**
 * Updates the selected dtype without starting a download.
 * Drops any in-memory instance when the dtype changes (weights stay on disk).
 */
export function setActiveGemmaDtype(dtype: GemmaDtypeId): void {
  if (dtype === activeDtype) return;
  activeDtype = dtype;
  embeddingInstance = null;
  embeddingLoadPromise = null;
  loadSnapshot = { phase: "idle", progress: 0, dtype };
}

/**
 * Latest model download/load progress (safe to poll from another request).
 */
export function getGemmaLoadSnapshot(): GemmaLoadSnapshot {
  if (embeddingInstance?.isLoaded()) {
    return { phase: "ready", progress: 100, dtype: activeDtype };
  }
  return { ...loadSnapshot, dtype: activeDtype };
}

function applyProgress(info: ProgressInfo) {
  if (info.status === "loading") {
    loadSnapshot = {
      phase: "loading",
      progress: Math.max(0, Math.min(100, info.progress ?? 0)),
      file: info.file,
      dtype: activeDtype,
    };
    return;
  }
  if (info.status === "ready") {
    loadSnapshot = { phase: "ready", progress: 100, dtype: activeDtype };
    return;
  }
  loadSnapshot = {
    phase: "error",
    progress: loadSnapshot.progress,
    file: info.file,
    error: info.error ?? "Model load failed",
    dtype: activeDtype,
  };
}

async function disposeInstance() {
  if (embeddingInstance?.isLoaded()) {
    await embeddingInstance.unload();
  }
  embeddingInstance = null;
  embeddingLoadPromise = null;
}

/**
 * Returns a shared server-side Gemma instance (loads on first use).
 */
export async function getServerGemmaEmbedding(options?: GemmaEmbeddingOptions) {
  const requested = options?.dtype;
  if (requested && isGemmaDtypeId(requested) && requested !== activeDtype) {
    await disposeInstance();
    activeDtype = requested;
  }

  if (embeddingInstance?.isLoaded()) {
    loadSnapshot = { phase: "ready", progress: 100, dtype: activeDtype };
    return embeddingInstance;
  }

  if (!embeddingInstance) {
    embeddingInstance = new GemmaEmbedding(
      resolveServerGemmaOptions({
        ...options,
        dtype: activeDtype,
        onProgress: (info) => {
          applyProgress(info);
          options?.onProgress?.(info);
        },
      }),
    );
  }

  if (!embeddingLoadPromise) {
    loadSnapshot = {
      phase: "loading",
      progress: Math.max(loadSnapshot.progress, 0),
      dtype: activeDtype,
    };
    embeddingLoadPromise = embeddingInstance
      .load()
      .then(() => {
        loadSnapshot = { phase: "ready", progress: 100, dtype: activeDtype };
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Model load failed";
        loadSnapshot = {
          phase: "error",
          progress: loadSnapshot.progress,
          error: message,
          dtype: activeDtype,
        };
        embeddingInstance = null;
        throw error;
      })
      .finally(() => {
        embeddingLoadPromise = null;
      });
  }

  await embeddingLoadPromise;
  return embeddingInstance!;
}

/**
 * Switch quantization and start download/load without awaiting completion.
 * Client should poll `getGemmaLoadSnapshot` for progress.
 */
export function beginServerGemmaDtypeSwitch(dtype: GemmaDtypeId): GemmaLoadSnapshot {
  if (dtype === activeDtype && embeddingInstance?.isLoaded()) {
    return getGemmaLoadSnapshot();
  }

  activeDtype = dtype;
  embeddingInstance = null;
  embeddingLoadPromise = null;
  loadSnapshot = { phase: "loading", progress: 0, dtype };

  void getServerGemmaEmbedding({ dtype }).catch(() => {
    // Error is recorded on loadSnapshot; callers poll for `phase: "error"`.
  });

  return getGemmaLoadSnapshot();
}

export type GemmaModelSettingsSnapshot = {
  activeDtype: GemmaDtypeId;
  load: GemmaLoadSnapshot;
  cache: GemmaCacheInventory;
};

/** Settings payload: active dtype + cache inventory + live load progress. */
export function getGemmaModelSettingsSnapshot(): GemmaModelSettingsSnapshot {
  return {
    activeDtype,
    load: getGemmaLoadSnapshot(),
    cache: inspectGemmaCache(),
  };
}

/**
 * Model id persisted on `project_embeddings.model_id`.
 */
export function getEmbeddingModelId() {
  return EMBEDDING_MODEL_ID;
}

/**
 * Embeds document text with the shared server Gemma instance.
 */
export async function embedDocument(text: string) {
  const embedding = await getServerGemmaEmbedding();
  return embedding.embed(text, "document");
}

/**
 * Embeds query text with the shared server Gemma instance.
 */
export async function embedQuery(text: string) {
  const embedding = await getServerGemmaEmbedding();
  return embedding.embed(text, "query");
}

/**
 * Disposes the shared server instance (e.g. after CLI batch completes).
 */
export async function unloadServerGemmaEmbedding() {
  await disposeInstance();
  loadSnapshot = { phase: "idle", progress: 0, dtype: activeDtype };
}
