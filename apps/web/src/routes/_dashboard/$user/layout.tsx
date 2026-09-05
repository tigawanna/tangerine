import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { loadQuery } from "react-relay";
import { graphql } from "relay-runtime";
import { z } from "zod";
import type { layoutUserPageLoaderQuery } from "./__generated__/layoutUserPageLoaderQuery.graphql";

export const repositoryOrderOptions = [
  "PUSHED_AT",
  "CREATED_AT",
  "NAME",
  "STARGAZERS",
  "UPDATED_AT",
] as const;
export const starOrderOptions = ["STARRED_AT"] as const;
export const directionOptions = ["ASC", "DESC"] as const;
export const userTabOptions = ["repos", "starred", "followers", "following"] as const;

const searchparams = z.object({
  tab: z.enum(userTabOptions).default("repos"),
  isFork: z.boolean().default(false),
  orderBy: z
    .object({
      field: z.enum(repositoryOrderOptions).default("PUSHED_AT"),
      direction: z.enum(directionOptions).default("DESC"),
    })
    .default({ field: "PUSHED_AT", direction: "DESC" }),
  starOrder: z
    .object({
      field: z.enum(starOrderOptions).default("STARRED_AT"),
      direction: z.enum(directionOptions).default("DESC"),
    })
    .default({ field: "STARRED_AT", direction: "DESC" }),
});

export type UserSearch = z.infer<typeof searchparams>;

/** Full search object for Links / redirects (Zod defaults make every field required). */
export const defaultUserSearch = {
  tab: "repos",
  isFork: false,
  orderBy: { field: "PUSHED_AT", direction: "DESC" },
  starOrder: { field: "STARRED_AT", direction: "DESC" },
} as const satisfies UserSearch;

export const Route = createFileRoute("/_dashboard/$user")({
  validateSearch: (search) => searchparams.parse(search),
  loaderDeps({ search: { isFork, orderBy, starOrder } }) {
    return { isFork, orderBy, starOrder };
  },
  beforeLoad: ({ params, context, location }) => {
    if (!context.relayEnvironment || !context.githubLogin) {
      throw redirect({ to: "/auth", search: { returnTo: location.pathname } });
    }
    if (!params.user?.trim()) {
      throw redirect({
        to: "/$user",
        params: { user: context.githubLogin },
        search: defaultUserSearch,
      });
    }
  },
  loader({ context, params, deps }) {
    return loadQuery<layoutUserPageLoaderQuery>(
      context.relayEnvironment!,
      userQuery,
      {
        login: params.user,
        isFork: deps.isFork,
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
  component: UserLayout,
});

function UserLayout() {
  return <Outlet />;
}

/**
 * Profile hub query — preload once; tabs consume fragments via `usePreloadedQuery`.
 */
export const userQuery = graphql`
  query layoutUserPageLoaderQuery(
    $login: String!
    $isFork: Boolean
    $orderBy: RepositoryOrder
    $starOrder: StarOrder
  ) {
    user(login: $login) {
      ...UserInfo
      ...UserFollowingFragment
      ...UserFollowersFragment
      ...UserRepos_repositories @arguments(isFork: $isFork, orderBy: $orderBy)
      ...UserStarredRepos_repositories @arguments(orderByStarredRepos: $starOrder)
    }
  }
`;
