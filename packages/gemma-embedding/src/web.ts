import { GemmaEmbedding } from "@kessler/gemma-embedding";
import { EMBEDDING_MODEL_ID } from "./constants.js";
import { resolveWebGemmaOptions } from "./web-options.js";
import type { GemmaEmbeddingOptions } from "./types.js";

export type { DeviceType, EmbedMode, GemmaEmbeddingOptions, ProgressInfo } from "./types.js";
export { EMBEDDING_MODEL_ID } from "./constants.js";
export { resolveWebGemmaOptions } from "./web-options.js";

/**
 * Creates a browser Gemma instance (caller owns lifecycle — no global singleton).
 */
export function createWebGemmaEmbedding(options?: GemmaEmbeddingOptions) {
  return new GemmaEmbedding(resolveWebGemmaOptions(options ?? {}));
}

/**
 * Model id persisted on `project_embeddings.model_id`.
 */
export function getEmbeddingModelId() {
  return EMBEDDING_MODEL_ID;
}

/**
 * Embeds document text with a loaded browser instance.
 */
export async function embedDocument(embedding: GemmaEmbedding, text: string) {
  return embedding.embed(text, "document");
}

/**
 * Embeds query text with a loaded browser instance.
 */
export async function embedQuery(embedding: GemmaEmbedding, text: string) {
  return embedding.embed(text, "query");
}
