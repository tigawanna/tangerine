import { sleep } from "@/lib/sse";
import { getEmbeddingModelsInventory } from "@/server/elysia/embedding-inventory";
import { Elysia, sse } from "elysia";

/**
 * Experiment API: embedded Elysia inside TanStack Start (no sidecar).
 * Mounted at `/api/elysia/$` — see `routes/api/elysia/$.ts`.
 *
 * Port order: hello → tick SSE → models list → download progress → load.
 */
export const elysiaApp = new Elysia({ prefix: "/api/elysia" })
  .get("/hello", () => ({
    message: "Hello from Elysia",
    at: new Date().toISOString(),
  }))
  .get("/tick", async function* ({ request }) {
    let n = 0;
    while (!request.signal.aborted) {
      n += 1;
      yield sse({
        event: "tick",
        data: { n, at: new Date().toISOString() },
      });
      try {
        await sleep(1000, request.signal);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") break;
        throw caught;
      }
    }
  })
  /** Catalog + on-disk inventory (runtime + model variants). Read-only. */
  .get("/embedding/models", () => getEmbeddingModelsInventory());

export type ElysiaApp = typeof elysiaApp;
