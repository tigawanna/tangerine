import type { GemmaEmbeddingOptions } from "./types.js";

/**
 * Node/CLI defaults: CPU + fp32. Honors `GEMMA_MODEL_PATH` when set.
 */
export function resolveServerGemmaOptions(
  options: GemmaEmbeddingOptions = {},
): GemmaEmbeddingOptions {
  const modelPath = options.modelPath ?? process.env.GEMMA_MODEL_PATH;

  return {
    device: "cpu",
    dtype: "fp32",
    ...options,
    ...(modelPath ? { modelPath } : {}),
  };
}
