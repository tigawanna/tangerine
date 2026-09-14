import type { GemmaDtypeId } from "../catalog.js";
import type { GemmaCacheInventory } from "./cache.js";

/** Avoid eager `@huggingface/transformers` (and ORT) on settings/cache-only imports. */
export type GemmaEmbeddingInstance = {
  isLoaded: () => boolean;
  load: () => Promise<void>;
  unload: () => Promise<void>;
  embed: (text: string, mode: "document" | "query") => Promise<number[]>;
};

export type GemmaLoadSnapshot = {
  phase: "idle" | "loading" | "ready" | "error";
  /** 0–100 while downloading / loading weights. */
  progress: number;
  file?: string;
  error?: string;
  /** Dtype the snapshot refers to (active selection or in-flight download). */
  dtype: GemmaDtypeId;
  /** Bytes on disk for this dtype so far (live download only; incomplete files are wiped on error). */
  loadedBytes?: number;
  /** Expected total bytes for this dtype (catalog approx). */
  totalBytes?: number;
  /**
   * False until the first credible HF progress sample arrives.
   * Avoids a flash of ~99% from per-file `ready` / tiny completed files.
   */
  progressSettled?: boolean;
};

export type GemmaDownloadJob = {
  dtype: GemmaDtypeId;
  cancelled: boolean;
  instance: GemmaEmbeddingInstance | null;
  promise: Promise<void>;
};

export type GemmaModelSettingsSnapshot = {
  activeDtype: GemmaDtypeId;
  load: GemmaLoadSnapshot;
  cache: GemmaCacheInventory;
};
