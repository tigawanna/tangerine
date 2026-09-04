import { GemmaEmbedding } from "@kessler/gemma-embedding";
import { EMBEDDING_MODEL_ID } from "./constants.js";
import { resolveServerGemmaOptions } from "./server-options.js";
import type { GemmaEmbeddingOptions } from "./types.js";

export type { DeviceType, EmbedMode, GemmaEmbeddingOptions, ProgressInfo } from "./types.js";
export { EMBEDDING_MODEL_ID } from "./constants.js";
export { resolveServerGemmaOptions } from "./server-options.js";

let embeddingInstance: GemmaEmbedding | null = null;
let embeddingLoadPromise: Promise<void> | null = null;

/**
 * Returns a shared server-side Gemma instance (loads on first use).
 */
export async function getServerGemmaEmbedding(options?: GemmaEmbeddingOptions) {
  if (!embeddingInstance) {
    embeddingInstance = new GemmaEmbedding(resolveServerGemmaOptions(options));
  }

  if (embeddingInstance.isLoaded()) {
    return embeddingInstance;
  }

  if (!embeddingLoadPromise) {
    embeddingLoadPromise = embeddingInstance.load().finally(() => {
      embeddingLoadPromise = null;
    });
  }

  await embeddingLoadPromise;
  return embeddingInstance;
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
  if (embeddingInstance?.isLoaded()) {
    await embeddingInstance.unload();
  }
  embeddingInstance = null;
  embeddingLoadPromise = null;
}
