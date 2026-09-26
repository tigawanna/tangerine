import {
  getGithubToken,
  rememberGithubTokenForWorkers,
} from "@/lib/github-token.server.ts";
import { pubSub } from "@/lib/pub-sub/client";
import { PUB_SUB_TOPICS } from "@/lib/pub-sub/topics";
import {
  beginUserRepoListCrawl,
  getUserRepoEmbedActivityStatus,
  markUserRepoListCrawlSettled,
  maybeMarkUserRepoEmbedDone,
  patchUserRepoEmbedActivity,
  resetUserRepoEmbedActivity,
  type UserRepoEmbedActivitySsePayload,
} from "@/elysia/routes/enrich/repos/helpers/embed-activity.ts";
import { enqueueAllUserRepos } from "@/elysia/routes/enrich/repos/helpers/enqueue.ts";
import { DEFAULT_USER_REPO_EMBED_LIMIT } from "@/elysia/routes/enrich/repos/helpers/queue.ts";
import { searchUserReposByQuery } from "@/elysia/routes/enrich/repos/helpers/search.ts";
import { userRepoEmbedWorker } from "@/elysia/routes/enrich/repos/helpers/worker.ts";
import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import { and, eq } from "drizzle-orm";
import { Elysia, sse, t } from "elysia";

const enqueueBody = t.Object({
  /** GitHub login whose owned repos to crawl (from `$user` route param). */
  login: t.String({ minLength: 1, description: "GitHub username to crawl repos for." }),
  /** GitHub OAuth token from the client (required on desktop — server cookies often missing). */
  token: t.Optional(t.String({ minLength: 1 })),
  pageSize: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 100,
      description: "Repos per GitHub page (max 100).",
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
  /** Max GraphQL pages this run; omit for a full crawl. Default UI uses 1 (top 100). */
  pages: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 50,
      description: "Max repo pages to fetch (omit = until complete).",
    }),
  ),
  after: t.Optional(
    t.String({
      description: "Resume cursor from a previous page-budget pause.",
    }),
  ),
});

function kickoffUserReposEnqueue(input: {
  login: string;
  token: string;
  pageSize: number;
  pages?: number;
  after?: string | null;
}) {
  beginUserRepoListCrawl();
  void enqueueAllUserRepos(input)
    .then((result) => {
      if (result.error === "429") {
        patchUserRepoEmbedActivity({
          phase: "waiting",
          list: { rateLimited: true },
          message: "GitHub rate limited — repos list crawl stopped",
        });
        return;
      }
      if (result.data === "crawl-done") {
        patchUserRepoEmbedActivity({
          phase: "embedding",
          message: "Repos list crawl finished — embedding queued repos",
        });
        return;
      }
      patchUserRepoEmbedActivity({
        phase: "listing",
        list: { after: result.data.nextCursor, rateLimited: false },
        message: `Page budget reached — resume with after=${result.data.nextCursor}`,
      });
    })
    .catch((caught: unknown) => {
      const message = caught instanceof Error ? caught.message : String(caught);
      patchUserRepoEmbedActivity({
        phase: "error",
        message: `Repos list crawl failed: ${message}`,
        embed: { lastError: message },
      });
    })
    .finally(() => {
      markUserRepoListCrawlSettled();
      void maybeMarkUserRepoEmbedDone();
    });
}

/**
 * User-owned repos enrich under `/api/elysia/enrich/repos/*`.
 * Login comes from the client (`$user` route param) — any public profile works.
 */
export const enrichedReposRoute = new Elysia({ prefix: "/repos" })
  .get(
    "/list",
    async () => {
      return db.query.projectEnrichmentOutputs.findMany({
        columns: {
          embedding: false,
        },
        where: eq(projectEnrichmentOutputs.type, "repos"),
      });
    },
    {
      detail: {
        summary: "List enriched user repos",
        description: "Get all enriched user-owned repos (human-readable enrichment outputs).",
        tags: ["enrich", "repos"],
      },
    },
  )
  .get(
    "/search",
    async ({ query }) => {
      return searchUserReposByQuery(query.q);
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
        summary: "Semantic search enriched user repos",
        description:
          "Embeds `q` with EmbeddingGemma (query mode) and returns nearest repos rows (no vector blob).",
        tags: ["enrich", "repos", "search"],
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
        summary: "Delete an enriched user repo",
        description: "Delete one enriched user repo by owner/name.",
        tags: ["enrich", "repos"],
      },
    },
  )
  .get(
    "/activity",
    async () => {
      await maybeMarkUserRepoEmbedDone();
      return getUserRepoEmbedActivityStatus();
    },
    {
      detail: {
        summary: "User repos enrich crawl status",
        description: "Latest user-repos list/embed progress snapshot.",
        tags: ["enrich", "repos", "stream"],
      },
    },
  )
  .get(
    "/activity/events",
    async function* ({ request }) {
      const initial: UserRepoEmbedActivitySsePayload = {
        status: getUserRepoEmbedActivityStatus(),
        row: null,
      };
      yield sse({ data: initial });

      for await (const payload of pubSub.listen<UserRepoEmbedActivitySsePayload>(
        PUB_SUB_TOPICS.USER_REPO_EMBED_PROGRESS,
        { signal: request.signal },
      )) {
        yield sse({ data: payload });
      }
    },
    {
      detail: {
        summary: "User repos enrich crawl SSE",
        description:
          "Streams user-repos list/embed activity. Frames may include a newly upserted enriched row (no vector).",
        tags: ["enrich", "repos", "stream"],
      },
    },
  )
  .post(
    "/enqueue",
    async ({ body }) => {
      try {
        const token = body.token?.trim() || (await getGithubToken());
        rememberGithubTokenForWorkers(token);

        const login = body.login.trim();
        const pageSize = body.pageSize ?? body.limit ?? DEFAULT_USER_REPO_EMBED_LIMIT;

        resetUserRepoEmbedActivity(login);

        const result = await enqueueAllUserRepos({
          login,
          token,
          pageSize,
          pages: body.pages,
          after: body.after,
        });

        if (result.error === "429") {
          patchUserRepoEmbedActivity({
            phase: "waiting",
            list: { rateLimited: true },
            message: "GitHub rate limited — repos list crawl stopped",
          });
          return {
            ok: false,
            message: `Rate limited while listing repos for ${login}`,
            login,
            pageSize,
            ...result,
            status: getUserRepoEmbedActivityStatus(),
          };
        }

        if (result.data === "crawl-done") {
          patchUserRepoEmbedActivity({
            phase: "embedding",
            message: "Repos list crawl finished — embedding queued repos",
          });
          return {
            ok: true,
            message: `Finished repos-list crawl for ${login}`,
            login,
            pageSize,
            ...result,
            status: getUserRepoEmbedActivityStatus(),
          };
        }

        patchUserRepoEmbedActivity({
          phase: "listing",
          list: { after: result.data.nextCursor, rateLimited: false },
          message: `Page budget reached — resume with after=${result.data.nextCursor}`,
        });

        return {
          ok: true,
          message: `Paused repos-list crawl for ${login}`,
          login,
          pageSize,
          ...result,
          status: getUserRepoEmbedActivityStatus(),
        };
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : String(caught);
        patchUserRepoEmbedActivity({
          phase: "error",
          message,
          embed: { lastError: message },
        });
        return { ok: false, message, status: getUserRepoEmbedActivityStatus() };
      } finally {
        markUserRepoListCrawlSettled();
        await maybeMarkUserRepoEmbedDone();
      }
    },
    {
      body: enqueueBody,
      detail: {
        summary: "Start user-repos enrich crawl",
        description:
          "Lists `login`'s owned repos into the embed queue (optionally page-budgeted) and tracks progress on the shared pub/sub bus.",
        tags: ["enrich", "repos", "worker"],
      },
    },
  )
  .post(
    "/run",
    async ({ body }) => {
      try {
        const token = body.token?.trim() || (await getGithubToken());
        rememberGithubTokenForWorkers(token);

        const login = body.login.trim();
        const pageSize = body.pageSize ?? body.limit ?? DEFAULT_USER_REPO_EMBED_LIMIT;

        resetUserRepoEmbedActivity(login);
        userRepoEmbedWorker.start();
        patchUserRepoEmbedActivity({
          phase: "listing",
          message: `Starting repos crawl + embed worker for ${login}…`,
        });

        kickoffUserReposEnqueue({
          login,
          token,
          pageSize,
          pages: body.pages,
          after: body.after,
        });

        return {
          ok: true,
          message: `Started repos embed for ${login}`,
          login,
          pageSize,
          pages: body.pages ?? null,
          workerId: userRepoEmbedWorker.id,
          status: getUserRepoEmbedActivityStatus(),
        };
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : String(caught);
        patchUserRepoEmbedActivity({
          phase: "error",
          message,
          embed: { lastError: message },
        });
        return { ok: false, message, status: getUserRepoEmbedActivityStatus() };
      }
    },
    {
      body: enqueueBody,
      detail: {
        summary: "Start user-repos crawl + embed worker together",
        description:
          "Starts the embed worker and kicks off the repos-list enqueue in the background. Progress streams on `/activity/events`. Pass `login` from the `$user` route param.",
        tags: ["enrich", "repos", "worker"],
      },
    },
  )
  .post(
    "/worker/start",
    () => {
      userRepoEmbedWorker.start();
      return {
        ok: true,
        workerId: userRepoEmbedWorker.id,
        status: getUserRepoEmbedActivityStatus(),
      };
    },
    {
      detail: {
        summary: "Start user-repos embed worker",
        description: "Begin polling the user-repo-embed queue (no-op if already running).",
        tags: ["enrich", "repos", "worker"],
      },
    },
  )
  .post(
    "/worker/pause",
    () => {
      userRepoEmbedWorker.pause();
      patchUserRepoEmbedActivity({
        phase: "waiting",
        message: "Embed worker paused",
        embed: { current: null },
      });
      return {
        ok: true,
        workerId: userRepoEmbedWorker.id,
        status: getUserRepoEmbedActivityStatus(),
      };
    },
    {
      detail: {
        summary: "Pause user-repos embed worker",
        description: "Stop fetching new embed jobs; in-flight jobs finish.",
        tags: ["enrich", "repos", "worker"],
      },
    },
  )
  .post(
    "/worker/resume",
    () => {
      userRepoEmbedWorker.resume();
      patchUserRepoEmbedActivity({
        phase: "embedding",
        message: "Embed worker resumed",
      });
      return {
        ok: true,
        workerId: userRepoEmbedWorker.id,
        status: getUserRepoEmbedActivityStatus(),
      };
    },
    {
      detail: {
        summary: "Resume user-repos embed worker",
        description: "Continue polling after a pause.",
        tags: ["enrich", "repos", "worker"],
      },
    },
  );
