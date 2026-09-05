import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "react-relay";
import type { layoutUserPageLoaderQuery } from "./__generated__/layoutUserPageLoaderQuery.graphql";
import { UserPage } from "./-components/user/UserPage";
import { userQuery, userSearchSchema } from "./layout";

/**
 * Profile hub — owns tab/filter search + Relay preload (not the `$user` layout),
 * so nested routes like repo detail stay free of profile search params.
 */
export const Route = createFileRoute("/_dashboard/$user/")({
  validateSearch: (search) => userSearchSchema.parse(search),
  loaderDeps({ search: { isFork, orderBy, starOrder, ownedByViewer } }) {
    return { isFork, orderBy, starOrder, ownedByViewer };
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
          field: deps.orderBy.field,
          direction: deps.orderBy.direction,
        },
        starOrder: {
          field: deps.starOrder.field,
          direction: deps.starOrder.direction,
        },
      },
      { fetchPolicy: "store-or-network" },
    );
  },
  component: UserPage,
});
