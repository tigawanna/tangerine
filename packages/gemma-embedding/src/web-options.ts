import type { GemmaEmbeddingOptions } from "./types.js";

/**
 * Browser defaults: WASM + q8. Override `device` to `webgpu` when supported.
 */
export function resolveWebGemmaOptions(options: GemmaEmbeddingOptions = {}): GemmaEmbeddingOptions {
  return {
    device: "wasm",
    dtype: "q8",
    ...options,
  };
}
