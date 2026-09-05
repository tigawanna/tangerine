import { getScrollRestorationKey } from "@/lib/tanstack/router/scroll-restoration-key";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { getTanstackQueryContext } from "./lib/tanstack/query/query-provider";
import { RouterNotFoundComponent } from "./lib/tanstack/router/RouterNotFoundComponent";
import { RouterPendingComponent } from "./lib/tanstack/router/RouterPendingComponent";
import { RouterErrorComponent } from "./lib/tanstack/router/routerErrorComponent";
import { routeTree } from "./routeTree.gen";

/**
 * Creates the TanStack Router instance for the GitHub dashboard app.
 */
export const getRouter = async () => {
  const tanstackQueryContext = getTanstackQueryContext();
  const router = createRouter({
    routeTree,
    defaultPendingComponent: () => <RouterPendingComponent />,
    defaultNotFoundComponent: () => <RouterNotFoundComponent />,
    defaultErrorComponent: ({ error }) => <RouterErrorComponent error={error} />,
    context: {
      ...tanstackQueryContext,
      /** Populated in `/_dashboard` `beforeLoad` (client-only). */
      relayEnvironment: null,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
    scrollRestorationBehavior: "instant",
    getScrollRestorationKey,
  });

  setupRouterSsrQueryIntegration({ router, queryClient: tanstackQueryContext.queryClient });
  return router;
};
