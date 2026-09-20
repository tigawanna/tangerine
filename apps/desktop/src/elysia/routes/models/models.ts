import { readGemmaPrefs, writeGemmaPrefs } from "@/data-access-layer/embeddings/gemma-prefs";
import { ensureOrtReady, refreshOrtRuntimeSnapshot } from "@/data-access-layer/embeddings/ort-runtime";
import { sleep } from "@/lib/sse";
import { Elysia, sse, t } from "elysia";

const dtypeBody = t.Object({
  dtype: t.Union([t.Literal("q4"), t.Literal("q8"), t.Literal("fp16"), t.Literal("fp32")]),
});

/**
 * EmbeddingGemma cache inventory, download/load, and path reveal.
 *
 * Mounted under `/api/elysia/embedding/models/*`.
 */
export const modelsRoute = new Elysia({ prefix: "/models" })
  .get(
    "/",
    async () => {
      const prefs = readGemmaPrefs();
      const runtime = await refreshOrtRuntimeSnapshot();
      const { inspectGemmaCache, setActiveGemmaDtype } = await import("@repo/gemma-embedding/node");
      setActiveGemmaDtype(prefs.dtype);

      return {
        at: new Date().toISOString(),
        activeDtype: prefs.dtype,
        runtime,
        models: inspectGemmaCache(),
      };
    },
    {
      detail: {
        summary: "Model inventory",
        description:
          "Lighter inventory for the lab UI: active dtype preference, ONNX Runtime snapshot, and on-disk Gemma cache variants.",
        tags: ["embedding", "models"],
      },
    },
  )
  .get(
    "/events",
    async function* ({ request }) {
      const { getGemmaLoadSnapshot } = await import("@repo/gemma-embedding/node");
      let previous: string | null = null;

      while (!request.signal.aborted) {
        const status = getGemmaLoadSnapshot();
        const serialized = JSON.stringify(status);
        if (serialized !== previous) {
          previous = serialized;
          yield sse({ data: status });
        }
        if (status.phase !== "loading") break;
        try {
          await sleep(250, request.signal);
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") break;
          throw caught;
        }
      }
    },
    {
      detail: {
        summary: "Model load SSE",
        description:
          "Streams live download/load progress for the active Gemma dtype. Closes after the first terminal (non-loading) frame.",
        tags: ["embedding", "models"],
      },
    },
  )
  .get(
    "/load",
    async () => {
      const { getGemmaLoadSnapshot } = await import("@repo/gemma-embedding/node");
      return getGemmaLoadSnapshot();
    },
    {
      detail: {
        summary: "Model load snapshot",
        description: "One-shot snapshot of the current Gemma download/load phase and progress.",
        tags: ["embedding", "models"],
      },
    },
  )
  .post(
    "/download",
    async ({ body }) => {
      await ensureOrtReady();
      const { beginServerGemmaDtypeDownload, preferIpv4ForHubFetches } =
        await import("@repo/gemma-embedding/node");
      preferIpv4ForHubFetches();
      return beginServerGemmaDtypeDownload(body.dtype);
    },
    {
      body: dtypeBody,
      detail: {
        summary: "Download model weights",
        description:
          "Start downloading weights for a dtype without activating it. Poll `/models/events` or `/models/load` for progress.",
        tags: ["embedding", "models"],
      },
    },
  )
  .post(
    "/cancel",
    async () => {
      const { unloadServerGemmaEmbedding, getGemmaLoadSnapshot } =
        await import("@repo/gemma-embedding/node");
      await unloadServerGemmaEmbedding();
      return getGemmaLoadSnapshot();
    },
    {
      detail: {
        summary: "Cancel model download",
        description:
          "Best-effort cancel of an in-flight download/load. Incomplete files are wiped (no byte-resume).",
        tags: ["embedding", "models"],
      },
    },
  )
  .post(
    "/select",
    async ({ body }) => {
      await ensureOrtReady();
      writeGemmaPrefs({ ...readGemmaPrefs(), dtype: body.dtype });
      const { beginServerGemmaDtypeSwitch, inspectGemmaCache, preferIpv4ForHubFetches } =
        await import("@repo/gemma-embedding/node");
      preferIpv4ForHubFetches();
      const inventory = inspectGemmaCache();
      const ready = inventory.variants.some((variant) => variant.id === body.dtype && variant.ready);
      if (!ready) {
        throw new Error(
          `${body.dtype.toUpperCase()} is not on disk yet — download it first, then load and switch.`,
        );
      }
      return beginServerGemmaDtypeSwitch(body.dtype);
    },
    {
      body: dtypeBody,
      detail: {
        summary: "Select and load dtype",
        description:
          "Persist the dtype preference and load that on-disk variant into memory. Fails if the weights are not downloaded yet.",
        tags: ["embedding", "models"],
      },
    },
  )
  .post(
    "/open",
    async ({ body }) => {
      const { openGemmaPathAt } = await import("@/data-access-layer/embeddings/open-gemma-path");
      return openGemmaPathAt(body.path);
    },
    {
      body: t.Object({
        path: t.String({ minLength: 1, maxLength: 4096 }),
      }),
      detail: {
        summary: "Reveal path in file manager",
        description: "Open a Gemma cache or ORT runtime path in the OS file manager.",
        tags: ["embedding", "models"],
      },
    },
  );
