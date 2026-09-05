import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { graphql } from "relay-runtime";
import { z } from "zod";

export const repositoryOrderOptions = [
  "PUSHED_AT",
  "CREATED_AT",
  "NAME",
  "STARGAZERS",
  "UPDATED_AT",
] as const;
export const starOrderOptions = ["STARRED_AT"] as const;
export const directionOptions = ["ASC", "DESC"] as const;
export const userTabOptions = [
  "repos",
  "starred",
  "followers",
  "following",
  "members",
] as const;

/**
 * Coerce URL string booleans. Bare `z.boolean()` rejects `"false"` from the query
 * string and can send TanStack into a validateSearch redirect loop.
 */
const searchBoolean = z.preprocess((value) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

/**
 * Flat, optional search only — no nested objects, no Zod `.default()`.
 * Defaults are applied in `resolveUserSearch` so validateSearch does not rewrite
 * the URL (rewrites → "Too many redirects" when opening another profile).
 */
export const userSearchSchema = z.object({
  tab: z.enum(userTabOptions).optional(),
  isFork: searchBoolean,
  ownedByViewer: searchBoolean,
  peopleQ: z.string().optional(),
  orderField: z.enum(repositoryOrderOptions).optional(),
  orderDir: z.enum(directionOptions).optional(),
  starDir: z.enum(directionOptions).optional(),
});

export type UserSearch = z.infer<typeof userSearchSchema>;

export type ResolvedUserSearch = {
  tab: (typeof userTabOptions)[number];
  isFork: boolean;
  ownedByViewer: boolean;
  peopleQ: string;
  orderField: (typeof repositoryOrderOptions)[number];
  orderDir: (typeof directionOptions)[number];
  starDir: (typeof directionOptions)[number];
};

/** Apply defaults in app code — not in validateSearch. */
export function resolveUserSearch(search: UserSearch): ResolvedUserSearch {
  return {
    tab: search.tab ?? "repos",
    isFork: search.isFork ?? false,
    ownedByViewer: search.ownedByViewer ?? false,
    peopleQ: search.peopleQ ?? "",
    orderField: search.orderField ?? "PUSHED_AT",
    orderDir: search.orderDir ?? "DESC",
    starDir: search.starDir ?? "DESC",
  };
}

/** Minimal search for profile Links (avoid stuffing every default into the URL). */
export const defaultUserSearch = { tab: "repos" } as const satisfies UserSearch;

/**
 * `$user` layout — auth gate + outlet only.
 */
export const Route = createFileRoute("/_dashboard/$user")({
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
  component: UserLayout,
});

function UserLayout() {
  return <Outlet />;
}

/**
 * Profile hub query — `user` + `repositoryOwner` (public orgs without `read:org`).
 */
export const userQuery = graphql`
  query layoutUserPageLoaderQuery(
    $login: String!
    $isFork: Boolean
    $orderBy: RepositoryOrder
    $starOrder: StarOrder
    $ownedByViewer: Boolean
  ) {
    user(login: $login) {
      ...UserInfo
      ...UserFollowingFragment
      ...UserFollowersFragment
      ...UserStarredRepos_repositories
        @arguments(orderByStarredRepos: $starOrder, ownedByViewer: $ownedByViewer)
    }
    repositoryOwner(login: $login) {
      __typename
      ...OwnerCard
      ...UserRepos_repositories @arguments(isFork: $isFork, orderBy: $orderBy)
    }
  }
`;
