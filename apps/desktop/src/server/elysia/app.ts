import { sleep } from "@/lib/sse";
import { consoleRoute } from "@/server/elysia/routes/console/index.ts";
import { embeddingsRoute } from "@/server/elysia/routes/models/embedding-inventory.ts";
import { workerRoute } from "@/server/elysia/routes/worker";
import { Elysia, sse } from "elysia";
import { enrichRoute } from "@/server/elysia/routes/enrich/index.ts";
import { helloRoute } from "@/server/elysia/routes/hello/index.ts";

/**
 * Embedded Elysia API for EmbeddingGemma + ORT (mounted at `/api/elysia/$`).
 * Settings, bootstrap, embed playground, and the lab UI all talk to this app.
 */
export const elysiaApp = new Elysia({ prefix: "/api/elysia" })
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
  .use(consoleRoute)
  .use(embeddingsRoute)
  .use(workerRoute)
  .use(enrichRoute)
  .use(helloRoute);

export type ElysiaApp = typeof elysiaApp;
