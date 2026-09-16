import { enrichedMineRoute } from "@/server/elysia/routes/enrich/mine/index.ts";
import { enrichedStarredRoute } from "@/server/elysia/routes/enrich/starred/index.ts";
import { Elysia } from "elysia";

export const enrichRoute = new Elysia({ prefix: "/enrich" })
  .use(enrichedMineRoute)
  .use(enrichedStarredRoute);
