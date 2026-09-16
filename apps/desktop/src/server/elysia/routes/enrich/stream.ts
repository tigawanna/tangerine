import { on } from "node:events";
import {
  embedActivityEmitter,
  getEmbedActivityStatus,
  type EmbedActivitySsePayload,
} from "@/server/elysia/routes/enrich/helpers/embed-activity.ts";
import { enqueueRepoEmbedListJob } from "@/server/elysia/routes/enrich/helpers/repo-list-worker.ts";
import { DEFAULT_REPO_EMBED_LIMIT } from "@/server/elysia/routes/enrich/helpers/repo-worker.ts";
import { Elysia, sse, t } from "elysia";

/** Starred-list crawl + SSE under `/api/elysia/enrich/stream/*`. */
export const enrichStreamRoute = new Elysia({ prefix: "/stream" })
  .get("/activity", () => getEmbedActivityStatus(), {
    detail: {
      summary: "Enrich crawl status",
      description: "Latest list/embed progress snapshot.",
      tags: ["enrich", "stream"],
    },
  })
  .get(
    "/activity/events",
    async function* ({ request }) {
      const initial: EmbedActivitySsePayload = {
        status: getEmbedActivityStatus(),
        row: null,
      };
      yield sse({ data: initial });

      for await (const [payload] of on(embedActivityEmitter, "activity", {
        signal: request.signal,
      })) {
        yield sse({ data: payload });
      }
    },
    {
      detail: {
        summary: "Enrich crawl SSE",
        description:
          "Streams list/embed activity. Frames may include a newly upserted enriched row (no vector).",
        tags: ["enrich", "stream"],
      },
    },
  )
  .post(
    "/enqueue",
    async ({ body }) => {
      const result = await enqueueRepoEmbedListJob({
        pageSize: body?.pageSize ?? body?.limit,
      });

      return {
        ok: true,
        message: `Started starred-list crawl for ${result.login}`,
        ...result,
        status: getEmbedActivityStatus(),
      };
    },
    {
      body: t.Optional(
        t.Object({
          pageSize: t.Optional(
            t.Number({
              minimum: 1,
              maximum: 100,
              default: DEFAULT_REPO_EMBED_LIMIT,
              description: "Starred repos per GitHub page (max 100).",
            }),
          ),
          /** @deprecated Prefer `pageSize`. */
          limit: t.Optional(
            t.Number({
              minimum: 1,
              maximum: 100,
              description: "Alias for pageSize (deprecated).",
            }),
          ),
        }),
      ),
      detail: {
        summary: "Start starred-repo enrich crawl",
        description:
          "Starts list + embed workers explicitly, enqueues the first starred page, " +
          "and tracks progress on the enrich activity emitter.",
        tags: ["enrich", "stream", "worker"],
      },
    },
  );
