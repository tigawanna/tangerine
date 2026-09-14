import {
  cancelEmbeddingBootstrap,
  getEmbeddingBootstrapStatus,
  resumeEmbeddingBootstrap,
  startEmbeddingBootstrap,
} from "@/data-access-layer/embeddings/embedding-bootstrap";
import { sleep } from "@/lib/sse";
import { Elysia, sse } from "elysia";

/**
 * First-run ORT + Q4 seed downloads.
 *
 * Mounted under `/api/elysia/embedding/bootstrap/*`.
 */
export const bootstrapRoute = new Elysia({ prefix: "/bootstrap" })
  .get("/", () => getEmbeddingBootstrapStatus(), {
    detail: {
      summary: "Bootstrap status",
      description:
        "Combined first-run status for ONNX Runtime and the Q4 seed model (phases, progress, shouldAutoStart).",
      tags: ["embedding", "bootstrap"],
    },
  })
  .post("/start", () => startEmbeddingBootstrap(), {
    detail: {
      summary: "Start bootstrap",
      description:
        "Begin first-run downloads: ORT if needed, then Q4 EmbeddingGemma weights. Returns immediately; poll status or SSE for progress.",
      tags: ["embedding", "bootstrap"],
    },
  })
  .post("/cancel", () => cancelEmbeddingBootstrap(), {
    detail: {
      summary: "Cancel bootstrap",
      description:
        "Cancel in-flight ORT/model bootstrap and mark prefs dismissed so auto-start will not retry until resume.",
      tags: ["embedding", "bootstrap"],
    },
  })
  .post("/resume", () => resumeEmbeddingBootstrap(), {
    detail: {
      summary: "Resume bootstrap",
      description: "Clear the dismissed flag and restart first-run ORT + Q4 downloads.",
      tags: ["embedding", "bootstrap"],
    },
  })
  .get(
    "/events",
    async function* ({ request }) {
      let previous: string | null = null;

      while (!request.signal.aborted) {
        const status = await getEmbeddingBootstrapStatus();
        const serialized = JSON.stringify(status);
        if (serialized !== previous) {
          previous = serialized;
          yield sse({ data: status });
        }
        const live =
          status.overall.phase === "running" ||
          status.runtime.phase === "downloading" ||
          status.model.phase === "downloading";
        if (!live) break;
        try {
          await sleep(1000, request.signal);
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") break;
          throw caught;
        }
      }
    },
    {
      detail: {
        summary: "Bootstrap SSE",
        description:
          "Streams live bootstrap status while ORT or Q4 downloads are in progress. Closes after the first terminal (non-live) frame.",
        tags: ["embedding", "bootstrap"],
      },
    },
  );
