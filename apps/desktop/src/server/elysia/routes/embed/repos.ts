import { db } from "@/db/client.ts";
import { Elysia } from "elysia";

export const embedReposRoute = new Elysia({ prefix: "/repos" }).get(
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
);
