import { clientEnv } from "@/lib/envs/client-env";
import { elysiaApp, type ElysiaApp } from "@/server/elysia/app";
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

function elysiaTreaty(origin?: string): ElysiaTreaty {
  const root = (
    origin ? treaty(origin) : treaty(elysiaApp as never)
  ) as unknown as ElysiaTreatyRoot;
  return root.api.elysia;
}

/**
 * Eden Treaty client for the embedded Elysia app.
 * Server: direct in-process call. Client: HTTP to same origin.
 * @see https://elysiajs.com/integrations/tanstack-start
 */
export const getElysiaTreaty = createIsomorphicFn()
  .server(() => elysiaTreaty())
  .client(() => {
    const origin = globalThis.location?.origin ?? clientEnv.VITE_APP_URL;
    return elysiaTreaty(origin);
  });
