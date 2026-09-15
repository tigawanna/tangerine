import { db } from "@/db/client.ts";
import { Elysia } from "elysia";

export const enrichRoute = new Elysia({ prefix: "/enrich" }).get(
  "/list",
  async () => {
    const repos = await db.query.enrichedRepos.findMany();
    return repos;
  },
  {
    detail: {
      summary: "Get enriched repos",
      description: "Get all enriched repos",
      tags: ["embedding", "repos"],
    },
  },
);
