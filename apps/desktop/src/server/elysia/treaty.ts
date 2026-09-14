import { clientEnv } from "@/lib/envs/client-env";
import type { ElysiaApp } from "@/server/elysia/app";
import { getServerElysiaTreaty } from "@/server/elysia/treaty.server";
import { treaty, type Treaty } from "@elysiajs/eden";
import { createIsomorphicFn } from "@tanstack/react-start";

/**
 * Route map from our app — avoids `treaty<typeof app>()` which breaks when
 * Deno and Vite resolve two `elysia` type identities (private `dependencies`).
 */
type AppRoutes = ElysiaApp["~Routes"];
type ElysiaTreatyRoot = Treaty.Sign<AppRoutes>;

/** Typed Eden client rooted at `/api/elysia`. */
export type ElysiaTreaty = ElysiaTreatyRoot["api"]["elysia"];

/**
 * Eden Treaty client for the embedded Elysia app.
 *
 * Per https://elysiajs.com/integrations/tanstack-start :
 * - Server: `treaty(app)` — direct, no HTTP
 * - Client: `treaty<typeof app>(origin)` — HTTP to same origin
 *
 * App value lives in `treaty.server.ts` so the client chunk never imports `app.ts`
 * (avoids route-tree circular init / lazyRouteComponent TDZ).
 */
export const getElysiaTreaty = createIsomorphicFn()
  .server(() => getServerElysiaTreaty())
  .client(() => {
    const origin = globalThis.location?.origin ?? clientEnv.VITE_APP_URL;
    return (treaty(origin) as unknown as ElysiaTreatyRoot).api.elysia;
  });
