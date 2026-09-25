import { createGitHubClient } from "@repo/github";
import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import {
  getGithubToken,
  rememberGithubTokenForWorkers,
} from "@/lib/github-token.server.ts";
import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import {
  getEmbedActivityStatus,
  patchEmbedActivity,
  resetEmbedActivity,
  type EmbedActivitySsePayload,
} from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { enqueueAllStarredRepos } from "@/elysia/routes/enrich/starred/helpers/enqueue.ts";
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
      const token = await getGithubToken();
      rememberGithubTokenForWorkers(token);

      const viewer = await createGitHubClient(token).getViewer();
      const pageSize = body?.pageSize ?? body?.limit ?? DEFAULT_REPO_EMBED_LIMIT;

      resetEmbedActivity(viewer.login);

      const result = await enqueueAllStarredRepos({
        login: viewer.login,
        token,
        pageSize,
        pages: body?.pages,
        after: body?.after,
      });

      if (result.error === "429") {
        patchEmbedActivity({
          phase: "waiting",
          list: { rateLimited: true },
          message: "GitHub rate limited — starred list crawl stopped",
        });
        return {
          ok: false,
          message: `Rate limited while listing stars for ${viewer.login}`,
          login: viewer.login,
          pageSize,
          ...result,
          status: getEmbedActivityStatus(),
        };
      }

      if (result.data === "crawl-done") {
        patchEmbedActivity({
          phase: "embedding",
          message: "Starred list crawl finished — embedding queued repos",
        });
        return {
          ok: true,
          message: `Finished starred-list crawl for ${viewer.login}`,
          login: viewer.login,
          pageSize,
          ...result,
          status: getEmbedActivityStatus(),
        };
      }

      patchEmbedActivity({
        phase: "listing",
        list: { after: result.data.nextCursor, rateLimited: false },
        message: `Page budget reached — resume with after=${result.data.nextCursor}`,
      });

      return {
        ok: true,
        message: `Paused starred-list crawl for ${viewer.login}`,
        login: viewer.login,
        pageSize,
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
          /** Max GraphQL pages this run; omit for a full crawl. */
          pages: t.Optional(
            t.Number({
              minimum: 1,
              maximum: 50,
              description: "Max starred pages to fetch (omit = until complete).",
            }),
          ),
          /** GraphQL `after` cursor to resume a prior crawl. */
          after: t.Optional(
            t.Union([t.String(), t.Null()], {
              description: "Resume cursor from a previous page-budget pause.",
            }),
          ),
        }),
      ),
      detail: {
        summary: "Start starred-repo enrich crawl",
        description:
          "Lists the viewer's starred repos into the embed queue (optionally " +
          "page-budgeted) and tracks progress on the shared pub/sub bus.",
        tags: ["enrich", "starred", "worker"],
      },
    },
  );
