import { db } from "@/db/client.ts";
import { DEFAULT_REPO_EMBED_LIMIT } from "@/server/elysia/routes/embed/helpers/repo-worker.ts";
import { startStarredRepoEmbedList } from "@/server/elysia/routes/embed/helpers/repo-list-worker.ts";
import { Elysia, t } from "elysia";

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
  .post(
    "/enqueue",
    async ({ body }) => {
      const result = await startStarredRepoEmbedList({
        pageSize: body?.pageSize ?? body?.limit,
      });

      return {
        ok: true,
        message: result.started
          ? `Started starred-list crawl for ${result.login} (page size ${result.pageSize})`
          : `Starred-list crawl already running for ${result.login}`,
        ...result,
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
              description: "Starred repos per GitHub page (max 100). Pages chain until exhausted.",
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
          "Starts a durable list worker that pages through the viewer's starred repos, " +
          "enqueueing one embed job per repo. On GitHub rate limits it pauses ~60s and retries " +
          "the same cursor. Does not run the embed worker.",
        tags: ["embedding", "repos", "worker"],
      },
    },
  );
