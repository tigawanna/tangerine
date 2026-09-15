import { clearIncompleteGemmaVariant } from "./cache.js";
import { getGemmaDtypeOption, isGemmaDtypeId } from "../catalog.js";
import { EMBEDDING_MODEL_ID } from "../constants.js";
import { resolveServerGemmaOptions } from "./options.js";
import type { GemmaEmbeddingOptions } from "../types.js";
import { cancelDownloadJob, disposeInstance } from "./lifecycle.js";
import { applyProgress, formatGemmaLoadError } from "./progress.js";
import {
  getActiveGemmaDtype,
  getEmbeddingInstance,
  getEmbeddingLoadPromise,
  getLoadSnapshot,
  setActiveDtypeInternal,
  setEmbeddingInstance,
  setEmbeddingLoadPromise,
  setLoadSnapshot,
} from "./state.js";

/**
 * Returns a shared server-side Gemma instance (loads on first use).
 */
export async function getServerGemmaEmbedding(options?: GemmaEmbeddingOptions) {
  const requested = options?.dtype;
  if (requested && isGemmaDtypeId(requested) && requested !== getActiveGemmaDtype()) {
    await disposeInstance();
    setActiveDtypeInternal(requested);
  }

  const activeDtype = getActiveGemmaDtype();
  let embeddingInstance = getEmbeddingInstance();

  if (embeddingInstance?.isLoaded()) {
    setLoadSnapshot({ phase: "ready", progress: 100, dtype: activeDtype });
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
    setEmbeddingInstance(embeddingInstance);
  }

  if (!getEmbeddingLoadPromise()) {
    const loadSnapshot = getLoadSnapshot();
    setLoadSnapshot({
      phase: "loading",
      progress: loadSnapshot.progressSettled ? loadSnapshot.progress : 0,
      file: loadSnapshot.file,
      dtype: activeDtype,
      loadedBytes: loadSnapshot.progressSettled ? loadSnapshot.loadedBytes : 0,
      totalBytes: loadSnapshot.totalBytes ?? getGemmaDtypeOption(activeDtype).approxBytes,
      progressSettled: loadSnapshot.progressSettled === true,
    });
    const loadPromise = embeddingInstance
      .load()
      .then(() => {
        setLoadSnapshot({
          phase: "ready",
          progress: 100,
          dtype: activeDtype,
          loadedBytes: getGemmaDtypeOption(activeDtype).approxBytes,
          totalBytes: getGemmaDtypeOption(activeDtype).approxBytes,
          progressSettled: true,
        });
      })
      .catch((error: unknown) => {
        const message = formatGemmaLoadError(error);
        clearIncompleteGemmaVariant(activeDtype);
        setLoadSnapshot({
          phase: "error",
          progress: 0,
          error: message,
          dtype: activeDtype,
        });
        setEmbeddingInstance(null);
        throw error;
      })
      .finally(() => {
        setEmbeddingLoadPromise(null);
      });
    setEmbeddingLoadPromise(loadPromise);
  }

  await getEmbeddingLoadPromise();
  return getEmbeddingInstance()!;
}

/**
 * Model id persisted on `project_enrichment_outputs.model_id`.
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
  setLoadSnapshot({ phase: "idle", progress: 0, dtype: getActiveGemmaDtype() });
}
