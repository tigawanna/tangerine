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
  beginListCrawl,
  getEmbedActivityStatus,
  markListCrawlSettled,
  maybeMarkEmbedDone,
  patchEmbedActivity,
  resetEmbedActivity,
  type EmbedActivitySsePayload,
} from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";
import { enqueueAllStarredRepos } from "@/elysia/routes/enrich/starred/helpers/enqueue.ts";
import { DEFAULT_REPO_EMBED_LIMIT } from "@/elysia/routes/enrich/starred/helpers/queue.ts";
import { searchStarredByQuery } from "@/elysia/routes/enrich/starred/helpers/search.ts";
import { starredRepoEmbedWorker } from "@/elysia/routes/enrich/starred/helpers/worker.ts";
import { and, eq } from "drizzle-orm";
import { Elysia, sse, t } from "elysia";

const enqueueBody = t.Object({
  /** GitHub OAuth token from the client (required on desktop — server cookies often missing). */
  token: t.Optional(t.String({ minLength: 1 })),
  pageSize: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 100,
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
  /** GraphQL `after` cursor to resume a prior crawl (omit when starting fresh). */
  after: t.Optional(
    t.String({
      description: "Resume cursor from a previous page-budget pause.",
    }),
  ),
});

/**
 * Background starred list crawl — patches activity when the run finishes or rate-limits.
 */
function kickoffStarredEnqueue(input: {
  login: string;
  token: string;
  pageSize: number;
  pages?: number;
  after?: string | null;
}) {
  beginListCrawl();
  void enqueueAllStarredRepos(input)
    .then((result) => {
      if (result.error === "429") {
        patchEmbedActivity({
          phase: "waiting",
          list: { rateLimited: true },
          message: "GitHub rate limited — starred list crawl stopped",
        });
        return;
      }
      if (result.data === "crawl-done") {
        patchEmbedActivity({
          phase: "embedding",
          message: "Starred list crawl finished — embedding queued repos",
        });
        return;
      }
      patchEmbedActivity({
        phase: "listing",
        list: { after: result.data.nextCursor, rateLimited: false },
        message: `Page budget reached — resume with after=${result.data.nextCursor}`,
      });
    })
    .catch((caught: unknown) => {
      const message = caught instanceof Error ? caught.message : String(caught);
      patchEmbedActivity({
        phase: "error",
        message: `Starred list crawl failed: ${message}`,
        embed: { lastError: message },
      });
    })
    .finally(() => {
      markListCrawlSettled();
      void maybeMarkEmbedDone();
    });
}

/**
 * Starred enrich under `/api/elysia/enrich/starred/*`:
 * list / delete rows + crawl status, SSE, enqueue, worker controls.
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
  .get(
    "/search",
    async ({ query }) => {
      return searchStarredByQuery(query.q);
    },
    {
      query: t.Object({
        q: t.String({
          minLength: 1,
          maxLength: 2000,
          description: "Natural-language query; embedded then ranked by cosine distance.",
        }),
      }),
      detail: {
        summary: "Semantic search enriched starred repos",
        description:
          "Embeds `q` with EmbeddingGemma (query mode) and returns nearest starred rows (no vector blob).",
        tags: ["enrich", "starred", "search"],
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
  .get(
    "/activity",
    async () => {
      // Heal stuck "embedding" UI if the queue already drained while the client was open.
      await maybeMarkEmbedDone();
      return getEmbedActivityStatus();
    },
    {
      detail: {
        summary: "Starred enrich crawl status",
        description: "Latest starred list/embed progress snapshot.",
        tags: ["enrich", "starred", "stream"],
      },
    },
  )
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
      try {
        const token = body.token?.trim() || (await getGithubToken());
        rememberGithubTokenForWorkers(token);

        const viewer = await createGitHubClient(token).getViewer();
        const pageSize = body.pageSize ?? body.limit ?? DEFAULT_REPO_EMBED_LIMIT;

        resetEmbedActivity(viewer.login);

        const result = await enqueueAllStarredRepos({
          login: viewer.login,
          token,
          pageSize,
          pages: body.pages,
          after: body.after,
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
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : String(caught);
        patchEmbedActivity({
          phase: "error",
          message,
          embed: { lastError: message },
        });
        return { ok: false, message, status: getEmbedActivityStatus() };
      } finally {
        markListCrawlSettled();
        await maybeMarkEmbedDone();
      }
    },
    {
      body: enqueueBody,
      detail: {
        summary: "Start starred-repo enrich crawl",
        description:
          "Lists the viewer's starred repos into the embed queue (optionally " +
          "page-budgeted) and tracks progress on the shared pub/sub bus.",
        tags: ["enrich", "starred", "worker"],
      },
    },
  )
  .post(
    "/run",
    async ({ body }) => {
      try {
        const token = body.token?.trim() || (await getGithubToken());
        rememberGithubTokenForWorkers(token);

        const viewer = await createGitHubClient(token).getViewer();
        const pageSize = body.pageSize ?? body.limit ?? DEFAULT_REPO_EMBED_LIMIT;

        resetEmbedActivity(viewer.login);
        starredRepoEmbedWorker.start();
        patchEmbedActivity({
          phase: "listing",
          message: "Starting starred list crawl + embed worker…",
        });

        kickoffStarredEnqueue({
          login: viewer.login,
          token,
          pageSize,
          pages: body.pages,
          after: body.after,
        });

        return {
          ok: true,
          message: `Started starred embed for ${viewer.login}`,
          login: viewer.login,
          pageSize,
          pages: body.pages ?? null,
          workerId: starredRepoEmbedWorker.id,
          status: getEmbedActivityStatus(),
        };
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : String(caught);
        patchEmbedActivity({
          phase: "error",
          message,
          embed: { lastError: message },
        });
        return { ok: false, message, status: getEmbedActivityStatus() };
      }
    },
    {
      body: enqueueBody,
      detail: {
        summary: "Start starred crawl + embed worker together",
        description:
          "Starts the embed worker and kicks off the starred-list enqueue in the background. Progress streams on `/activity/events`.",
        tags: ["enrich", "starred", "worker"],
      },
    },
  )
  .post(
    "/worker/start",
    () => {
      starredRepoEmbedWorker.start();
      return {
        ok: true,
        workerId: starredRepoEmbedWorker.id,
        status: getEmbedActivityStatus(),
      };
    },
    {
      detail: {
        summary: "Start starred embed worker",
        description: "Begin polling the repo-embed queue (no-op if already running).",
        tags: ["enrich", "starred", "worker"],
      },
    },
  )
  .post(
    "/worker/pause",
    () => {
      starredRepoEmbedWorker.pause();
      patchEmbedActivity({
        phase: "waiting",
        message: "Embed worker paused",
        embed: { current: null },
      });
      return {
        ok: true,
        workerId: starredRepoEmbedWorker.id,
        status: getEmbedActivityStatus(),
      };
    },
    {
      detail: {
        summary: "Pause starred embed worker",
        description: "Stop fetching new embed jobs; in-flight jobs finish.",
        tags: ["enrich", "starred", "worker"],
      },
    },
  )
  .post(
    "/worker/resume",
    () => {
      starredRepoEmbedWorker.resume();
      patchEmbedActivity({
        phase: "embedding",
        message: "Embed worker resumed",
      });
      return {
        ok: true,
        workerId: starredRepoEmbedWorker.id,
        status: getEmbedActivityStatus(),
      };
    },
    {
      detail: {
        summary: "Resume starred embed worker",
        description: "Continue polling after a pause.",
        tags: ["enrich", "starred", "worker"],
      },
    },
  );
