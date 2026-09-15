import { Elysia } from "elysia";
import { db } from "@/db/client.ts";

export const embedReposRoute = new Elysia({ prefix: "/repos" })
  .get(
    "/",
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
