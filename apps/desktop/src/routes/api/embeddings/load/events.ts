import { encodeSseData, sleep, sseResponse } from "@/lib/sse";
import { createFileRoute } from "@tanstack/react-router";

/**
 * SSE: live Gemma load/download snapshot while `phase === "loading"`.
 * `EventSource('/api/embeddings/load/events')`.
 */
export const Route = createFileRoute("/api/embeddings/load/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const signal = request.signal;
            try {
              let previous: string | null = null;
              while (!signal.aborted) {
                const { getGemmaLoadSnapshot } = await import("@repo/gemma-embedding/server");
                const status = getGemmaLoadSnapshot();
                const serialized = JSON.stringify(status);
                if (serialized !== previous) {
                  previous = serialized;
                  controller.enqueue(encodeSseData(status));
                }
                if (status.phase !== "loading") break;
                await sleep(1000, signal);
              }
            } catch (caught) {
              if (!(caught instanceof DOMException && caught.name === "AbortError")) {
                controller.enqueue(
                  encodeSseData({
                    error: caught instanceof Error ? caught.message : "load stream failed",
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
