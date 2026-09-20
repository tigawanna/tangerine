import { enrichedMineRoute } from "@/elysia/routes/enrich/mine/index.ts";
import { enrichedStarredRoute } from "@/elysia/routes/enrich/starred/index.ts";
import { Elysia } from "elysia";

/**
 * Enrichment API under `/api/elysia/enrich/*`:
 * - `/mine/*` — list / delete (mine crawl TBD)
 * - `/starred/*` — list / delete + crawl status, SSE, enqueue
 */
export const enrichRoute = new Elysia({ prefix: "/enrich" })
  .use(enrichedMineRoute)
  .use(enrichedStarredRoute);
