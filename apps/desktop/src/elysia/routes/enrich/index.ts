import { enrichedReposRoute } from "@/elysia/routes/enrich/repos/index.ts";
import { enrichedStarredRoute } from "@/elysia/routes/enrich/starred/index.ts";
import { Elysia } from "elysia";

/**
 * Enrichment API under `/api/elysia/enrich/*`:
 * - `/repos/*` — any GitHub user’s owned repos (login from client / `$user`)
 * - `/starred/*` — viewer starred list crawl + embed
 */
export const enrichRoute = new Elysia({ prefix: "/enrich" })
  .use(enrichedReposRoute)
  .use(enrichedStarredRoute);
