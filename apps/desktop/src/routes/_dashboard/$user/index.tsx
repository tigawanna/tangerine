import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "react-relay";
import type { layoutUserPageLoaderQuery } from "./__generated__/layoutUserPageLoaderQuery.graphql";
import { UserPage } from "./-components/user/UserPage";
import { resolveUserSearch, userQuery, userSearchSchema } from "./layout";

/**
 * Profile hub — owns tab/filter search + Relay preload.
 */
export const Route = createFileRoute("/_dashboard/$user/")({
  validateSearch: (search) => userSearchSchema.parse(search),
  loaderDeps({ search }) {
    const resolved = resolveUserSearch(search);
    return {
      isFork: resolved.isFork,
      ownedByViewer: resolved.ownedByViewer,
      orderField: resolved.orderField,
      orderDir: resolved.orderDir,
      starDir: resolved.starDir,
    };
  },
  loader({ context, params, deps }) {
    return loadQuery<layoutUserPageLoaderQuery>(
      context.relayEnvironment!,
      userQuery,
      {
        login: params.user,
        isFork: deps.isFork,
        ownedByViewer: deps.ownedByViewer,
        orderBy: {
          field: deps.orderField,
          direction: deps.orderDir,
        },
        starOrder: {
          field: "STARRED_AT",
          direction: deps.starDir,
        },
      },
      { fetchPolicy: "store-or-network" },
    );
  },
  component: UserPage,
});
