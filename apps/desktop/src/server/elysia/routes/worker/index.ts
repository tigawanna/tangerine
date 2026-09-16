import { Elysia } from "elysia";

/**
 * Placeholder worker routes. Demo-batch was removed; real crawl lives under `/embed/repos/*`.
 */
export const workerRoute = new Elysia({ prefix: "/worker" });
