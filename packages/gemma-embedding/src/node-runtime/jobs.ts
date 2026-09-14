import { clearIncompleteGemmaVariant, inspectGemmaCache } from "./cache.js";
import { getGemmaDtypeOption, type GemmaDtypeId } from "../catalog.js";
import { resolveServerGemmaOptions } from "./options.js";
import { getServerGemmaEmbedding } from "./instance.js";
import { cancelDownloadJob, restoreLoadSnapshotAfterDownload } from "./lifecycle.js";
import { applyProgress, formatGemmaLoadError } from "./progress.js";
import {
  getActiveGemmaDtype,
  getDownloadJob,
  getEmbeddingInstance,
  getEmbeddingLoadPromise,
  getGemmaLoadSnapshot,
  getLoadSnapshot,
  setActiveDtypeInternal,
  setDownloadJob,
  setEmbeddingInstance,
  setEmbeddingLoadPromise,
  setLoadSnapshot,
} from "./state.js";
import type { GemmaDownloadJob, GemmaLoadSnapshot } from "./types.js";

/**
 * Switch quantization and start download/load without awaiting completion.
 * Client should poll `getGemmaLoadSnapshot` for progress.
 */
export function beginServerGemmaDtypeSwitch(dtype: GemmaDtypeId): GemmaLoadSnapshot {
  if (dtype === getActiveGemmaDtype() && getEmbeddingInstance()?.isLoaded()) {
    return getGemmaLoadSnapshot();
  }

  // Cancel any download-only job so it cannot clobber switch progress.
  void cancelDownloadJob();
  clearIncompleteGemmaVariant(dtype);

  setActiveDtypeInternal(dtype);
  setEmbeddingInstance(null);
  setEmbeddingLoadPromise(null);
  setLoadSnapshot({
    phase: "loading",
    progress: 0,
    dtype,
    loadedBytes: 0,
    totalBytes: getGemmaDtypeOption(dtype).approxBytes,
    progressSettled: false,
  });

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

  const existingJob = getDownloadJob();
  if (existingJob?.dtype === dtype && !existingJob.cancelled) {
    return getGemmaLoadSnapshot();
  }

  if (getEmbeddingLoadPromise() || (getLoadSnapshot().phase === "loading" && !existingJob)) {
    return getGemmaLoadSnapshot();
  }

  void cancelDownloadJob();

  // Stale `.tmp` / half-written finals cannot be resumed — start from an empty slate.
  clearIncompleteGemmaVariant(dtype);

  setLoadSnapshot({
    phase: "loading",
    progress: 0,
    dtype,
    loadedBytes: 0,
    totalBytes: getGemmaDtypeOption(dtype).approxBytes,
    progressSettled: false,
  });

  const job: GemmaDownloadJob = {
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
          if (job.cancelled || getDownloadJob() !== job) return;
          applyProgress(info, dtype);
        },
      }),
    );
    job.instance = instance;

    try {
      await instance.load();
      await instance.unload();
      if (!job.cancelled && getDownloadJob() === job) {
        // Download-only: weights on disk, not loaded — progress 100 so SSE clients can flip UI.
        setLoadSnapshot({
          phase: "idle",
          progress: 100,
          dtype,
          loadedBytes: getGemmaDtypeOption(dtype).approxBytes,
          totalBytes: getGemmaDtypeOption(dtype).approxBytes,
          progressSettled: true,
        });
      }
    } catch (error: unknown) {
      if (job.cancelled || getDownloadJob() !== job) return;
      setLoadSnapshot({
        phase: "error",
        progress: 0,
        error: formatGemmaLoadError(error),
        dtype,
      });
    } finally {
      if (getDownloadJob() === job) {
        setDownloadJob(null);
      }
      // Incomplete weights are useless (no byte-resume). Skip if a newer job owns this dtype.
      const superseded = getDownloadJob()?.dtype === dtype;
      const ready = inspectGemmaCache().variants.find((variant) => variant.id === dtype)?.ready;
      if (!superseded && !ready) {
        clearIncompleteGemmaVariant(dtype);
      }
    }
  })();

  setDownloadJob(job);
  return getGemmaLoadSnapshot();
}
