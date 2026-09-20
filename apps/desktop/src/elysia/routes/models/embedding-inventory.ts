import { getEmbeddingBootstrapStatus } from "@/data-access-layer/embeddings/embedding-bootstrap";
import { gemmaPrefsFilePath, readGemmaPrefs } from "@/data-access-layer/embeddings/gemma-prefs";
import { bootstrapRoute } from "@/elysia/routes/models/bootstrap";
import { embedRoute } from "@/elysia/routes/models/embed";
import { modelsRoute } from "@/elysia/routes/models/models";
import { Elysia } from "elysia";

/**
 * EmbeddingGemma + ORT via Elysia (replaces TanStack `/api/embeddings` + server-fns).
 *
 * Mounted under `/api/elysia/embedding/*`.
 * Sub-routes: {@link bootstrapRoute}, {@link modelsRoute}, {@link embedRoute}.
 */
export const embeddingsRoute = new Elysia({ prefix: "/embedding" })
  .get(
    "/settings",
    async () => {
      const prefs = readGemmaPrefs();
      const { getGemmaModelSettingsSnapshot, setActiveGemmaDtype } =
        await import("@repo/gemma-embedding/node");
      setActiveGemmaDtype(prefs.dtype);
      const snapshot = getGemmaModelSettingsSnapshot();
      const bootstrap = await getEmbeddingBootstrapStatus();
      return {
        ...snapshot,
        prefsPath: gemmaPrefsFilePath(),
        bootstrap,
      };
    },
    {
      detail: {
        summary: "Embedding settings snapshot",
        description:
          "Active dtype, cache inventory, prefs path, load snapshot, and first-run bootstrap status for the Settings model picker.",
        tags: ["embedding"],
      },
    },
  )
  .use(bootstrapRoute)
  .use(modelsRoute)
  .use(embedRoute);
