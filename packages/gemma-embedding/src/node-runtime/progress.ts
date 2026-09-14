import { inspectGemmaCache } from "./cache.js";
import { getGemmaDtypeOption, type GemmaDtypeId } from "../catalog.js";
import type { ProgressInfo } from "../types.js";
import { getActiveGemmaDtype, getLoadSnapshot, setLoadSnapshot } from "./state.js";

/** Human-readable load/download failures (HF fetch timeouts look like vague `fetch failed`). */
export function formatGemmaLoadError(error: unknown): string {
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

export function applyProgress(info: ProgressInfo, dtype: GemmaDtypeId = getActiveGemmaDtype()) {
  const loadSnapshot = getLoadSnapshot();

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
      setLoadSnapshot({
        phase: "loading",
        progress: 0,
        file: info.file,
        dtype,
        loadedBytes: 0,
        totalBytes,
        progressSettled: false,
      });
      return;
    }

    const progress = Math.min(99, raw);
    setLoadSnapshot({
      phase: "loading",
      progress,
      file: info.file,
      dtype,
      ...byteProgressForDtype(dtype, progress),
      progressSettled: true,
    });
    return;
  }

  setLoadSnapshot({
    phase: "error",
    progress: loadSnapshot.progress,
    file: info.file,
    error: info.error ?? "Model load failed",
    dtype,
    loadedBytes: loadSnapshot.loadedBytes,
    totalBytes: loadSnapshot.totalBytes ?? getGemmaDtypeOption(dtype).approxBytes,
    progressSettled: loadSnapshot.progressSettled,
  });
}
