import { Elysia } from "elysia";

/**
 * Placeholder worker routes. Demo-batch was removed; real crawl lives under `/enrich/starred/*`.
 */
export const workerRoute = new Elysia({ prefix: "/worker" });
