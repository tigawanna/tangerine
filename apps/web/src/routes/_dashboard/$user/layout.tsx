import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { loadQuery } from "react-relay";
import { graphql } from "relay-runtime";
import type { layoutUserPageLoaderQuery } from "./__generated__/layoutUserPageLoaderQuery.graphql";

export const Route = createFileRoute("/_dashboard/$user")({
  beforeLoad: ({ params, context, location }) => {
    if (!context.relayEnvironment || !context.githubLogin) {
      throw redirect({ to: "/auth", search: { returnTo: location.pathname } });
    }
    if (!params.user?.trim()) {
      throw redirect({
        to: "/$user",
        params: { user: context.githubLogin },
      });
    }
  },
  loader({ context, params }) {
    return loadQuery<layoutUserPageLoaderQuery>(
      context.relayEnvironment!,
      userQuery,
      { login: params.user },
      { fetchPolicy: "store-or-network" },
    );
  },
  component: UserLayout,
});

function UserLayout() {
  return <Outlet />;
}

/**
 * Shared profile query for `/$user` — preload in the layout loader,
 * consume with `usePreloadedQuery` in child routes.
 */
export const userQuery = graphql`
  query layoutUserPageLoaderQuery($login: String!) {
    user(login: $login) {
      ...UserInfo
    }
  }
`;
