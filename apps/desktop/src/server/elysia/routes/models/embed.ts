import { EMBED_TEXT_MAX_CHARS } from "@/data-access-layer/embeddings/embed-limits";
import { readGemmaPrefs } from "@/data-access-layer/embeddings/gemma-prefs";
import { ensureOrtReady } from "@/data-access-layer/embeddings/ort-runtime";
import { Elysia, t } from "elysia";

const embedBody = t.Object({
  text: t.String({ minLength: 1, maxLength: EMBED_TEXT_MAX_CHARS }),
  mode: t.Union([t.Literal("document"), t.Literal("query")]),
});

/**
 * One-shot embed playground endpoint.
 *
 * Mounted under `/api/elysia/embedding/embed`.
 */
export const embedRoute = new Elysia()
  .post(
    "/embed",
    async ({ body }) => {
      const prefs = readGemmaPrefs();
      await ensureOrtReady();
      const { getEmbeddingModelId, getServerGemmaEmbedding } =
        await import("@repo/gemma-embedding/node");

      const totalStart = performance.now();
      const loadStart = performance.now();
      const embedding = await getServerGemmaEmbedding({ dtype: prefs.dtype });
      const loadMs = performance.now() - loadStart;

      const embedStart = performance.now();
      const vector =
        body.mode === "query"
          ? await embedding.embed(body.text, "query")
          : await embedding.embed(body.text, "document");
      const embedMs = performance.now() - embedStart;

      return {
        modelId: getEmbeddingModelId(),
        dimensions: vector.length,
        mode: body.mode,
        embedding: Array.from(vector),
        timing: {
          loadMs,
          embedMs,
          totalMs: performance.now() - totalStart,
        },
      };
    },
    {
      body: embedBody,
      detail: {
        summary: "Embed text",
        description:
          "One-shot embed with the active dtype (document or query mode). Returns the vector and timing; does not write to the DB.",
        tags: ["embedding"],
      },
    },
  );
