import { db } from "@/db/client.ts";
import { projectEnrichmentOutputs } from "@/db/index.ts";
import { enrichStreamRoute } from "@/server/elysia/routes/enrich/stream.ts";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

export const enrichRoute = new Elysia({ prefix: "/enrich" })
  .use(enrichStreamRoute)
  .get(
    "/list",
    async () => {
      // List SoT is enrichment outputs (one row per repo). Omit the vector blob.
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
        summary: "Delete an enriched repo",
        description: "Delete an enriched repo",
        tags: ["embedding", "repos"],
      },
    },
  );
