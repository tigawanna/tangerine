import { inspectGemmaCache, type GemmaCacheInventory } from "./cache.js";
import {
  DEFAULT_GEMMA_DTYPE,
  getGemmaDtypeOption,
  isGemmaDtypeId,
  type GemmaDtypeId,
} from "./catalog.js";
import { EMBEDDING_MODEL_ID } from "./constants.js";
import { preferIpv4ForHubFetches } from "./prefer-ipv4.js";
import { resolveServerGemmaOptions } from "./server-options.js";
import type { GemmaEmbeddingOptions, ProgressInfo } from "./types.js";

/** Avoid eager `@huggingface/transformers` (and ORT) on settings/cache-only imports. */
type GemmaEmbeddingInstance = {
  isLoaded: () => boolean;
  load: () => Promise<void>;
  unload: () => Promise<void>;
  embed: (text: string, mode: "document" | "query") => Promise<number[]>;
};

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
  /** Dtype the snapshot refers to (active selection or in-flight download). */
  dtype: GemmaDtypeId;
  /** Bytes on disk for this dtype so far (partial downloads included). */
  loadedBytes?: number;
  /** Expected total bytes for this dtype (catalog approx). */
  totalBytes?: number;
  /**
   * False until the first credible HF progress sample arrives.
   * Avoids a flash of ~99% from per-file `ready` / tiny completed files.
   */
  progressSettled?: boolean;
};

let embeddingInstance: GemmaEmbeddingInstance | null = null;
let embeddingLoadPromise: Promise<void> | null = null;
let activeDtype: GemmaDtypeId = resolveInitialDtype();
let loadSnapshot: GemmaLoadSnapshot = {
  phase: "idle",
  progress: 0,
  dtype: activeDtype,
};

/** In-flight download-only job (does not change active dtype / prefs). */
let downloadJob: {
  dtype: GemmaDtypeId;
  cancelled: boolean;
  instance: GemmaEmbeddingInstance | null;
  promise: Promise<void>;
} | null = null;

function resolveInitialDtype(): GemmaDtypeId {
  const fromEnv = process.env.GEMMA_DTYPE?.trim();
  if (fromEnv && isGemmaDtypeId(fromEnv)) return fromEnv;
  return DEFAULT_GEMMA_DTYPE;
}

export { preferIpv4ForHubFetches } from "./prefer-ipv4.js";

preferIpv4ForHubFetches();

/** Human-readable load/download failures (HF fetch timeouts look like vague `fetch failed`). */
function formatGemmaLoadError(error: unknown): string {
  if (!(error instanceof Error)) return "Model load failed";
  const cause =
    "cause" in error && error.cause && typeof error.cause === "object"
      ? (error.cause as { code?: string; message?: string })
      : undefined;
  const code = cause?.code;
  if (code === "ENETUNREACH" || code === "ETIMEDOUT" || error.message === "fetch failed") {
    return `Hugging Face download failed (${code ?? "network"}). Connection dropped before weights finished — retry, or use a variant already on disk.`;
  }
  return error.message;
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
  if (embeddingInstance?.isLoaded() && !downloadJob) {
    return { phase: "ready", progress: 100, dtype: activeDtype };
  }
  return { ...loadSnapshot };
}

/**
 * Kessler forwards per-file HF `ready` events as overall ready, and the first
 * progress tick can spike near 100% when only tiny files have reported totals.
 * Hold the UI at 0 until we see a credible sample; never treat callback `ready`
 * as complete (only `load()` resolution does).
 */
function byteProgressForDtype(dtype: GemmaDtypeId, progressPct: number) {
  const totalBytes = getGemmaDtypeOption(dtype).approxBytes;
  const onDisk =
    inspectGemmaCache().variants.find((variant) => variant.id === dtype)?.onDiskBytes ?? 0;
  const fromPercent = Math.round((Math.min(99, progressPct) / 100) * totalBytes);
  return {
    totalBytes,
    loadedBytes: Math.min(totalBytes, Math.max(onDisk, fromPercent)),
  };
}

function applyProgress(info: ProgressInfo, dtype: GemmaDtypeId = activeDtype) {
  if (info.status === "ready") {
    // Per-file ready — ignore for % (keeps counter at 0 / last credible value).
    return;
  }

  if (info.status === "loading") {
    const raw = Math.max(0, Math.min(100, info.progress ?? 0));
    const totalBytes = getGemmaDtypeOption(dtype).approxBytes;
    const settled = loadSnapshot.progressSettled === true;

    // First ticks that spike ≥90% are almost always incomplete bookkeeping.
    if (!settled && raw >= 90) {
      loadSnapshot = {
        phase: "loading",
        progress: 0,
        file: info.file,
        dtype,
        loadedBytes: 0,
        totalBytes,
        progressSettled: false,
      };
      return;
    }

    const progress = Math.min(99, raw);
    loadSnapshot = {
      phase: "loading",
      progress,
      file: info.file,
      dtype,
      ...byteProgressForDtype(dtype, progress),
      progressSettled: true,
    };
    return;
  }

  loadSnapshot = {
    phase: "error",
    progress: loadSnapshot.progress,
    file: info.file,
    error: info.error ?? "Model load failed",
    dtype,
    loadedBytes: loadSnapshot.loadedBytes,
    totalBytes: loadSnapshot.totalBytes ?? getGemmaDtypeOption(dtype).approxBytes,
    progressSettled: loadSnapshot.progressSettled,
  };
}

async function disposeInstance() {
  if (embeddingInstance?.isLoaded()) {
    await embeddingInstance.unload();
  }
  embeddingInstance = null;
  embeddingLoadPromise = null;
}

function restoreLoadSnapshotAfterDownload() {
  if (embeddingInstance?.isLoaded()) {
    loadSnapshot = { phase: "ready", progress: 100, dtype: activeDtype };
    return;
  }
  loadSnapshot = { phase: "idle", progress: 0, dtype: activeDtype };
}

async function cancelDownloadJob() {
  if (!downloadJob) return;
  downloadJob.cancelled = true;
  const instance = downloadJob.instance;
  downloadJob = null;
  if (instance) {
    await instance.unload().catch(() => undefined);
  }
  restoreLoadSnapshotAfterDownload();
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
    const { GemmaEmbedding } = await import("@kessler/gemma-embedding");
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
      progress: loadSnapshot.progressSettled ? loadSnapshot.progress : 0,
      file: loadSnapshot.file,
      dtype: activeDtype,
      loadedBytes: loadSnapshot.progressSettled ? loadSnapshot.loadedBytes : 0,
      totalBytes: loadSnapshot.totalBytes ?? getGemmaDtypeOption(activeDtype).approxBytes,
      progressSettled: loadSnapshot.progressSettled === true,
    };
    embeddingLoadPromise = embeddingInstance
      .load()
      .then(() => {
        loadSnapshot = {
          phase: "ready",
          progress: 100,
          dtype: activeDtype,
          loadedBytes: getGemmaDtypeOption(activeDtype).approxBytes,
          totalBytes: getGemmaDtypeOption(activeDtype).approxBytes,
          progressSettled: true,
        };
      })
      .catch((error: unknown) => {
        const message = formatGemmaLoadError(error);
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

  // Cancel any download-only job so it cannot clobber switch progress.
  void cancelDownloadJob();

  activeDtype = dtype;
  embeddingInstance = null;
  embeddingLoadPromise = null;
  loadSnapshot = {
    phase: "loading",
    progress: 0,
    dtype,
    loadedBytes: 0,
    totalBytes: getGemmaDtypeOption(dtype).approxBytes,
    progressSettled: false,
  };

  void getServerGemmaEmbedding({ dtype }).catch(() => {
    // Error is recorded on loadSnapshot; callers poll for `phase: "error"`.
  });

  return getGemmaLoadSnapshot();
}

/**
 * Download ONNX weights for a dtype onto disk without activating it.
 * Does not change `activeDtype`. Unloads the temp instance when finished.
 */
export function beginServerGemmaDtypeDownload(dtype: GemmaDtypeId): GemmaLoadSnapshot {
  const cached = inspectGemmaCache().variants.find((v) => v.id === dtype);
  if (cached?.ready) {
    restoreLoadSnapshotAfterDownload();
    return getGemmaLoadSnapshot();
  }

  if (downloadJob?.dtype === dtype && !downloadJob.cancelled) {
    return getGemmaLoadSnapshot();
  }

  if (embeddingLoadPromise || (loadSnapshot.phase === "loading" && !downloadJob)) {
    return getGemmaLoadSnapshot();
  }

  void cancelDownloadJob();

  loadSnapshot = {
    phase: "loading",
    progress: 0,
    dtype,
    loadedBytes: 0,
    totalBytes: getGemmaDtypeOption(dtype).approxBytes,
    progressSettled: false,
  };

  const job: {
    dtype: GemmaDtypeId;
    cancelled: boolean;
    instance: GemmaEmbeddingInstance | null;
    promise: Promise<void>;
  } = {
    dtype,
    cancelled: false,
    instance: null,
    promise: Promise.resolve(),
  };

  job.promise = (async () => {
    const { GemmaEmbedding } = await import("@kessler/gemma-embedding");
    if (job.cancelled) return;

    const instance = new GemmaEmbedding(
      resolveServerGemmaOptions({
        dtype,
        onProgress: (info) => {
          if (job.cancelled || downloadJob !== job) return;
          applyProgress(info, dtype);
        },
      }),
    );
    job.instance = instance;

    try {
      await instance.load();
      await instance.unload();
      if (!job.cancelled && downloadJob === job) {
        restoreLoadSnapshotAfterDownload();
      }
    } catch (error: unknown) {
      if (job.cancelled || downloadJob !== job) return;
      loadSnapshot = {
        phase: "error",
        progress: loadSnapshot.progress,
        error: formatGemmaLoadError(error),
        dtype,
      };
    } finally {
      if (downloadJob === job) {
        downloadJob = null;
      }
    }
  })();

  downloadJob = job;
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
  await cancelDownloadJob();
  await disposeInstance();
  loadSnapshot = { phase: "idle", progress: 0, dtype: activeDtype };
}
