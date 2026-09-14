import type { ElysiaApp } from "@/server/elysia/app";
import { elysiaApp } from "@/server/elysia/app";
import { treaty, type Treaty } from "@elysiajs/eden";

/**
 * Route map from our app — avoids `treaty<typeof app>()` which breaks when
 * Deno and Vite resolve two `elysia` type identities (private `dependencies`).
 */
type AppRoutes = ElysiaApp["~Routes"];
type ElysiaTreatyRoot = Treaty.Sign<AppRoutes>;

/** Docs: `treaty(app).api` — direct in-process call (server only). */
export function getServerElysiaTreaty() {
  return (treaty(elysiaApp as never) as unknown as ElysiaTreatyRoot).api.elysia;
}
