/** HuggingFace id used by `@kessler/gemma-embedding`. */
export const GEMMA_HF_MODEL_ID = "onnx-community/embeddinggemma-300m-ONNX";

export type GemmaDtypeId = "q4" | "q8" | "fp16" | "fp32";

export type GemmaDtypeOption = {
  id: GemmaDtypeId;
  /** UI label */
  label: string;
  /** Short description for settings */
  description: string;
  /** Approximate download size in bytes (graph + external data). */
  approxBytes: number;
  /** Filenames under `onnx/` relative to the model cache dir. */
  files: readonly [graph: string, data: string];
};

/**
 * CPU-friendly EmbeddingGemma ONNX variants, ordered smallest → largest
 * (lowest → highest quality). `q4f16` omitted — WebGPU-oriented per kessler docs.
 */
export const GEMMA_DTYPE_OPTIONS = [
  {
    id: "q4",
    label: "Q4",
    description: "Lowest quality / smallest download — good for trying the feature quickly.",
    approxBytes: 197_000_000,
    files: ["model_q4.onnx", "model_q4.onnx_data"],
  },
  {
    id: "q8",
    label: "Q8",
    description: "Balanced quality and size (~300MB).",
    approxBytes: 309_000_000,
    files: ["model_quantized.onnx", "model_quantized.onnx_data"],
  },
  {
    id: "fp16",
    label: "FP16",
    description: "Higher quality — larger download (~600MB).",
    approxBytes: 618_000_000,
    files: ["model_fp16.onnx", "model_fp16.onnx_data"],
  },
  {
    id: "fp32",
    label: "FP32",
    description: "Highest quality / full precision — ~1.2GB; slowest to fetch.",
    approxBytes: 1_235_000_000,
    files: ["model.onnx", "model.onnx_data"],
  },
] as const satisfies readonly GemmaDtypeOption[];

export const DEFAULT_GEMMA_DTYPE: GemmaDtypeId = "q4";

export function isGemmaDtypeId(value: string): value is GemmaDtypeId {
  return GEMMA_DTYPE_OPTIONS.some((option) => option.id === value);
}

export function getGemmaDtypeOption(id: GemmaDtypeId): GemmaDtypeOption {
  const option = GEMMA_DTYPE_OPTIONS.find((entry) => entry.id === id);
  if (!option) throw new Error(`Unknown Gemma dtype: ${id}`);
  return option;
}
