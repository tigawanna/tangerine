import { inspectGemmaCache } from "./cache.js";
import { getActiveGemmaDtype, getGemmaLoadSnapshot } from "./state.js";
import type { GemmaModelSettingsSnapshot } from "./types.js";

/** Settings payload: active dtype + cache inventory + live load progress. */
export function getGemmaModelSettingsSnapshot(): GemmaModelSettingsSnapshot {
  return {
    activeDtype: getActiveGemmaDtype(),
    load: getGemmaLoadSnapshot(),
    cache: inspectGemmaCache(),
  };
}
