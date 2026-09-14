import { DEFAULT_GEMMA_DTYPE, isGemmaDtypeId } from "../catalog.js";
import type { GemmaEmbeddingOptions } from "../types.js";

/**
 * Node/CLI defaults: CPU + q4 (smallest ONNX ~200MB).
 * Avoid fp32 unless the user opts in — HuggingFace ships a **~1.2GB** weight file.
 * Honors `GEMMA_MODEL_PATH` / `GEMMA_DTYPE` when set.
 */
export function resolveServerGemmaOptions(
  options: GemmaEmbeddingOptions = {},
): GemmaEmbeddingOptions {
  const modelPath = options.modelPath ?? process.env.GEMMA_MODEL_PATH;
  const envDtype = process.env.GEMMA_DTYPE?.trim();
  const fromEnv = envDtype && isGemmaDtypeId(envDtype) ? envDtype : DEFAULT_GEMMA_DTYPE;
  const dtype = options.dtype ?? fromEnv;

  return {
    device: "cpu",
    ...options,
    dtype,
    ...(modelPath ? { modelPath } : {}),
  };
}
