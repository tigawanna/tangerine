import { on } from "node:events";
import { db } from "@/db/client.ts";
import {
  embedActivityEmitter,
  getEmbedActivityStatus,
  type EmbedActivitySsePayload,
} from "@/server/elysia/routes/embed/helpers/embed-activity.ts";
import { enqueueRepoEmbedListJob } from "@/server/elysia/routes/embed/helpers/repo-list-worker.ts";
import { DEFAULT_REPO_EMBED_LIMIT } from "@/server/elysia/routes/embed/helpers/repo-worker.ts";
import { Elysia, sse, t } from "elysia";

export const embedReposRoute = new Elysia({ prefix: "/repos" })
  .get(
    "/",
    async () => {
      return db.query.projectEnrichmentOutputs.findMany({
        columns: {
          embedding: false,
        },
      });
    },
    {
      detail: {
        summary: "Get enriched repos",
        description: "Get all enriched repos (human-readable enrichment outputs)",
        tags: ["embedding", "repos"],
      },
    },
  )
  .get("/activity", () => getEmbedActivityStatus(), {
    detail: {
      summary: "Embed crawl status",
      description: "Latest list/embed progress snapshot.",
      tags: ["embedding", "repos"],
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
        summary: "Embed crawl SSE",
        description:
          "Streams list/embed activity. Frames may include a newly upserted enriched row (no vector).",
        tags: ["embedding", "repos"],
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
        summary: "Start starred-repo embed list crawl",
        description:
          "Starts list + embed workers explicitly, enqueues the first starred page, " +
          "and tracks progress on the embed activity emitter.",
        tags: ["embedding", "repos", "worker"],
      },
    },
  );
