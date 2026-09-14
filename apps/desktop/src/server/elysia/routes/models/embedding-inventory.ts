import { readGemmaPrefs } from "@/data-access-layer/embeddings/gemma-prefs";
import { refreshOrtRuntimeSnapshot } from "@/data-access-layer/embeddings/ort-runtime";
import { Elysia } from "elysia";

/** One-shot inventory for the Elysia embedding experiment (list only). */
// export type EmbeddingModelsInventory = {
//   at: string;
//   activeDtype: "q4" | "q8" | "fp16" | "fp32";
//   runtime: OrtRuntimeSnapshot;
//   models: GemmaCacheInventory;
// };

/**
 * Lists ORT runtime readiness + EmbeddingGemma variants on disk.
 * Read-only — no download / load side effects.
 */
// export async function getEmbeddingModelsInventory(): Promise<EmbeddingModelsInventory> {
//   const prefs = readGemmaPrefs();
//   const runtime = await refreshOrtRuntimeSnapshot();
//   const { inspectGemmaCache, setActiveGemmaDtype } = await import("@repo/gemma-embedding/server");
//   setActiveGemmaDtype(prefs.dtype);

//   return {
//     at: new Date().toISOString(),
//     activeDtype: prefs.dtype,
//     runtime,
//     models: inspectGemmaCache(),
//   };
// }

export const embeddingsRoute = new Elysia({ prefix: "/embedding" })
.get("/models", async () => {
  const prefs = readGemmaPrefs();
  const runtime = await refreshOrtRuntimeSnapshot();
  const { inspectGemmaCache, setActiveGemmaDtype } = await import("@repo/gemma-embedding/server");
  setActiveGemmaDtype(prefs.dtype);

  return {
    at: new Date().toISOString(),
    activeDtype: prefs.dtype,
    runtime,
    models: inspectGemmaCache(),
  };
});
