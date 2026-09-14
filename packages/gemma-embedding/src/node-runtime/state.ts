import {
  DEFAULT_GEMMA_DTYPE,
  isGemmaDtypeId,
  type GemmaDtypeId,
} from "../catalog.js";
import type {
  GemmaDownloadJob,
  GemmaEmbeddingInstance,
  GemmaLoadSnapshot,
} from "./types.js";

function resolveInitialDtype(): GemmaDtypeId {
  const fromEnv = process.env.GEMMA_DTYPE?.trim();
  if (fromEnv && isGemmaDtypeId(fromEnv)) return fromEnv;
  return DEFAULT_GEMMA_DTYPE;
}

let embeddingInstance: GemmaEmbeddingInstance | null = null;
let embeddingLoadPromise: Promise<void> | null = null;
let activeDtype: GemmaDtypeId = resolveInitialDtype();
let loadSnapshot: GemmaLoadSnapshot = {
  phase: "idle",
  progress: 0,
  dtype: activeDtype,
};
/** In-flight download-only job (does not change active dtype / prefs). */
let downloadJob: GemmaDownloadJob | null = null;

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

export function getEmbeddingInstance() {
  return embeddingInstance;
}

export function setEmbeddingInstance(instance: GemmaEmbeddingInstance | null) {
  embeddingInstance = instance;
}

export function getEmbeddingLoadPromise() {
  return embeddingLoadPromise;
}

export function setEmbeddingLoadPromise(promise: Promise<void> | null) {
  embeddingLoadPromise = promise;
}

export function getLoadSnapshot() {
  return loadSnapshot;
}

export function setLoadSnapshot(snapshot: GemmaLoadSnapshot) {
  loadSnapshot = snapshot;
}

export function getDownloadJob() {
  return downloadJob;
}

export function setDownloadJob(job: GemmaDownloadJob | null) {
  downloadJob = job;
}

export function setActiveDtypeInternal(dtype: GemmaDtypeId) {
  activeDtype = dtype;
}
