import { sleep } from "@/lib/sse";
import { chatRoute } from "@/elysia/routes/chat/index.ts";
import { consoleRoute } from "@/elysia/routes/console/index.ts";
import { embeddingsRoute } from "@/elysia/routes/models/embedding-inventory.ts";
import { workerRoute } from "@/elysia/routes/worker";
import { Elysia, sse } from "elysia";
import { enrichRoute } from "@/elysia/routes/enrich/index.ts";
import { helloRoute } from "@/elysia/routes/hello/index.ts";

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
  .use(helloRoute)
  .use(chatRoute);

export type ElysiaApp = typeof elysiaApp;
