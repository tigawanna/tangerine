import { preferIpv4ForHubFetches } from "./node-runtime/prefer-ipv4.js";

preferIpv4ForHubFetches();

export type { DeviceType, EmbedMode, GemmaEmbeddingOptions, ProgressInfo } from "./types.js";
export { EMBEDDING_MODEL_ID } from "./constants.js";
export {
  DEFAULT_GEMMA_DTYPE,
  GEMMA_DTYPE_OPTIONS,
  GEMMA_HF_MODEL_ID,
  getGemmaDtypeOption,
  isGemmaDtypeId,
  type GemmaDtypeId,
  type GemmaDtypeOption,
} from "./catalog.js";

export { preferIpv4ForHubFetches } from "./node-runtime/prefer-ipv4.js";
export { resolveServerGemmaOptions } from "./node-runtime/options.js";
export {
  clearIncompleteGemmaVariant,
  getGemmaModelCacheDir,
  getTransformersCacheRoot,
  inspectGemmaCache,
  type GemmaCachedVariant,
  type GemmaCacheInventory,
} from "./node-runtime/cache.js";

export type {
  GemmaLoadSnapshot,
  GemmaModelSettingsSnapshot,
} from "./node-runtime/types.js";
export {
  getActiveGemmaDtype,
  getGemmaLoadSnapshot,
  setActiveGemmaDtype,
} from "./node-runtime/state.js";
export {
  embedDocument,
  embedQuery,
  getEmbeddingModelId,
  getServerGemmaEmbedding,
  unloadServerGemmaEmbedding,
} from "./node-runtime/instance.js";
export {
  beginServerGemmaDtypeDownload,
  beginServerGemmaDtypeSwitch,
} from "./node-runtime/jobs.js";
export { getGemmaModelSettingsSnapshot } from "./node-runtime/settings.js";
