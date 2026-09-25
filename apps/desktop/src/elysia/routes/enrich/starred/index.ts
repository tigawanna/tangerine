import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import {
  getEmbedActivityStatus,
  type EmbedActivitySsePayload,
} from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { enqueueRepoEmbedListJob } from "@/elysia/routes/enrich/starred/helpers/repo-list-worker.ts";
import { DEFAULT_REPO_EMBED_LIMIT } from "@/elysia/routes/enrich/starred/helpers/queue.ts";
import { and, eq } from "drizzle-orm";
import { Elysia, sse, t } from "elysia";

/**
 * Starred enrich under `/api/elysia/enrich/starred/*`:
 * list / delete rows + crawl status, SSE, enqueue.
 */
export const enrichedStarredRoute = new Elysia({ prefix: "/starred" })
  .get(
    "/list",
    async () => {
      // List SoT is enrichment outputs (one row per repo). Omit the vector blob.
      return db.query.projectEnrichmentOutputs.findMany({
        columns: {
          embedding: false,
        },
        where: eq(projectEnrichmentOutputs.type, "starred"),
      });
    },
    {
      detail: {
        summary: "List enriched starred repos",
        description: "Get all enriched starred repos (human-readable enrichment outputs).",
        tags: ["enrich", "starred"],
      },
    },
  )
  .delete(
    "/:owner/:name",
    async ({ params }) => {
      try {
        if (!params.owner || !params.name) {
          return {
            data: null,
            error: {
              message: "Owner and name are required",
              code: "MISSING_OWNER_AND_NAME",
            },
          };
        }
        await db
          .delete(projectEnrichmentOutputs)
          .where(
            and(
              eq(projectEnrichmentOutputs.owner, params.owner),
              eq(projectEnrichmentOutputs.name, params.name),
            ),
          );
        return {
          data: {
            message: "Enriched repo deleted",
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: {
            message: "Failed to delete enriched repo",
            code: "FAILED_TO_DELETE_ENRICHED_REPO",
          },
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Delete an enriched starred repo",
        description: "Delete one enriched starred repo by owner/name.",
        tags: ["enrich", "starred"],
      },
    },
  )
  .get("/activity", () => getEmbedActivityStatus(), {
    detail: {
      summary: "Starred enrich crawl status",
      description: "Latest starred list/embed progress snapshot.",
      tags: ["enrich", "starred", "stream"],
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

      for await (const payload of pubSub.listen<EmbedActivitySsePayload>(
        PUB_SUB_TOPICS.REPO_EMBED_PROGRESS,
        { signal: request.signal },
      )) {
        yield sse({ data: payload });
      }
    },
    {
      detail: {
        summary: "Starred enrich crawl SSE",
        description:
          "Streams starred list/embed activity. Frames may include a newly upserted enriched row (no vector).",
        tags: ["enrich", "starred", "stream"],
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
          "and tracks progress on the shared pub/sub bus.",
        tags: ["enrich", "starred", "worker"],
      },
    },
  );
