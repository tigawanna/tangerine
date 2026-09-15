import { sleep } from "@/lib/sse";
import {
  enqueueDemoBatch,
  getDemoBatchStatus,
} from "@/lib/worker/demo-batch";
import { Elysia, sse, t } from "elysia";

/**
 * Conveyor demo jobs under `/api/elysia/worker/*`.
 */
export const workerRoute = new Elysia({ prefix: "/worker" })
  .get("/demo-batch", () => getDemoBatchStatus(), {
    detail: {
      summary: "Demo batch status",
      description: "Current progress for the Conveyor demo batch job.",
      tags: ["worker"],
    },
  })
  .post(
    "/demo-batch",
    async ({ body }) => {
      const enqueued = await enqueueDemoBatch({
        total: body?.total,
        batchSize: body?.batchSize,
      });

      return {
        ok: true,
        message: "Demo batch job enqueued (1000 items, 10 at a time by default)",
        ...enqueued,
        status: getDemoBatchStatus(),
      };
    },
    {
      body: t.Optional(
        t.Object({
          total: t.Optional(t.Number({ minimum: 1, maximum: 10_000 })),
          batchSize: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        }),
      ),
      detail: {
        summary: "Enqueue demo batch job",
        description:
          "Loops over N items (default 1000) in chunks of batchSize (default 10). " +
          "Each item randomly returns 200 or 429; on 429 waits 20s then retries.",
        tags: ["worker"],
      },
    },
  )
  .get(
    "/demo-batch/events",
    async function* ({ request }) {
      let previous: string | null = null;

      while (!request.signal.aborted) {
        const current = getDemoBatchStatus();
        const serialized = JSON.stringify(current);
        if (serialized !== previous) {
          previous = serialized;
          yield sse({ data: current });
        }

        const live = current.phase === "running" || current.phase === "waiting";
        if (!live) break;

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
        summary: "Demo batch SSE",
        description:
          "Streams demo-batch status while a job is running or waiting on 429. Closes on idle/done/error.",
        tags: ["worker"],
      },
    },
  );
