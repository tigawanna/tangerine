import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";

/** Enriched “mine” repos under `/api/elysia/enrich/mine/*`. */
export const enrichedMineRoute = new Elysia({ prefix: "/mine" })
  .get(
    "/list",
    async () => {
      // List SoT is enrichment outputs (one row per repo). Omit the vector blob.
      return db.query.projectEnrichmentOutputs.findMany({
        columns: {
          embedding: false,
        },
        where: eq(projectEnrichmentOutputs.type, "mine"),
      });
    },
    {
      detail: {
        summary: "List enriched mine repos",
        description:
          "Get all enriched repos owned by the viewer (human-readable enrichment outputs).",
        tags: ["enrich", "mine"],
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
        summary: "Delete an enriched mine repo",
        description: "Delete one enriched mine repo by owner/name.",
        tags: ["enrich", "mine"],
      },
    },
  )
  .post(
    "/start",
    async ({ body }) => {
      // return db.insert(projectEnrichmentOutputs).values(body);
    },
    {
      detail: {
        summary: "Start an enrichment worker for my repos",
        description: "Start an enrichment worker for my repos.",
        tags: ["enrich", "mine"],
      },
    },
  );
