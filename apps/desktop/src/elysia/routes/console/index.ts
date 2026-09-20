import { sleep } from "@/lib/sse";
import { sampleProcessMetrics } from "@/elysia/routes/console/sample-metrics.ts";
import { Elysia, sse } from "elysia";

const SAMPLE_MS = 1000;

/** Process metrics under `/api/elysia/console/*` for the enriched console. */
export const consoleRoute = new Elysia({ prefix: "/console" })
  .get("/", () => sampleProcessMetrics(), {
    detail: {
      summary: "Process metrics snapshot",
      description: "One-shot RSS / heap / CPU sample for the app server process.",
      tags: ["console"],
    },
  })
  .get(
    "/metrics",
    async function* ({ request }) {
      // Prime the CPU delta baseline so the first emitted frame is meaningful.
      sampleProcessMetrics();
      try {
        await sleep(SAMPLE_MS, request.signal);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        throw caught;
      }

      while (!request.signal.aborted) {
        yield sse({ data: sampleProcessMetrics() });
        try {
          await sleep(SAMPLE_MS, request.signal);
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") break;
          throw caught;
        }
      }
    },
    {
      detail: {
        summary: "Process metrics SSE",
        description:
          "Streams process RSS, heap, and CPU % about once per second while the client is connected.",
        tags: ["console"],
      },
    },
  );
