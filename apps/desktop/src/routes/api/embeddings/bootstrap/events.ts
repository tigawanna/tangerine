import { getEmbeddingBootstrapStatus } from "@/data-access-layer/embeddings/embedding-bootstrap";
import { encodeSseData, sleep, sseResponse } from "@/lib/sse";
import { createFileRoute } from "@tanstack/react-router";

/**
 * SSE: embedding bootstrap status (ORT + Q4).
 * `EventSource('/api/embeddings/bootstrap/events')` — closes after a terminal frame.
 */
export const Route = createFileRoute("/api/embeddings/bootstrap/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const signal = request.signal;
            try {
              let previous: string | null = null;
              while (!signal.aborted) {
                const status = await getEmbeddingBootstrapStatus();
                const serialized = JSON.stringify(status);
                if (serialized !== previous) {
                  previous = serialized;
                  controller.enqueue(encodeSseData(status));
                }
                const live =
                  status.overall.phase === "running" ||
                  status.runtime.phase === "downloading" ||
                  status.model.phase === "downloading";
                if (!live) break;
                await sleep(1000, signal);
              }
            } catch (caught) {
              if (!(caught instanceof DOMException && caught.name === "AbortError")) {
                controller.enqueue(
                  encodeSseData({
                    error: caught instanceof Error ? caught.message : "bootstrap stream failed",
                  }),
                );
              }
            } finally {
              try {
                controller.close();
              } catch {
                // already closed
              }
            }
          },
        });

        return sseResponse(stream);
      },
    },
  },
});
