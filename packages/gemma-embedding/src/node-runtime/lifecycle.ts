import { clearIncompleteGemmaVariant } from "./cache.js";
import {
  getActiveGemmaDtype,
  getDownloadJob,
  getEmbeddingInstance,
  setDownloadJob,
  setEmbeddingInstance,
  setEmbeddingLoadPromise,
  setLoadSnapshot,
} from "./state.js";

export async function disposeInstance() {
  const embeddingInstance = getEmbeddingInstance();
  if (embeddingInstance?.isLoaded()) {
    await embeddingInstance.unload();
  }
  setEmbeddingInstance(null);
  setEmbeddingLoadPromise(null);
}

export function restoreLoadSnapshotAfterDownload() {
  const embeddingInstance = getEmbeddingInstance();
  const activeDtype = getActiveGemmaDtype();
  if (embeddingInstance?.isLoaded()) {
    setLoadSnapshot({ phase: "ready", progress: 100, dtype: activeDtype });
    return;
  }
  setLoadSnapshot({ phase: "idle", progress: 0, dtype: activeDtype });
}

export async function cancelDownloadJob() {
  const downloadJob = getDownloadJob();
  if (!downloadJob) return;
  const dtype = downloadJob.dtype;
  downloadJob.cancelled = true;
  const instance = downloadJob.instance;
  setDownloadJob(null);
  if (instance) {
    await instance.unload().catch(() => undefined);
  }
  // HF does not byte-resume — drop partials so the next attempt is a clean download.
  clearIncompleteGemmaVariant(dtype);
  restoreLoadSnapshotAfterDownload();
}
