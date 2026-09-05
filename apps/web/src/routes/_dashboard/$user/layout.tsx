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
/** Profile tabs — `members` reserved for orgs when `read:org` is available. */
export const userTabOptions = [
  "repos",
  "starred",
  "followers",
  "following",
  "members",
] as const;

export const userSearchSchema = z.object({
  tab: z.enum(userTabOptions).default("repos"),
  isFork: z.boolean().default(false),
  ownedByViewer: z.boolean().default(false),
  peopleQ: z.string().default(""),
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

export type UserSearch = z.infer<typeof userSearchSchema>;

export const defaultUserSearch = {
  tab: "repos",
  isFork: false,
  ownedByViewer: false,
  peopleQ: "",
  orderBy: { field: "PUSHED_AT", direction: "DESC" },
  starOrder: { field: "STARRED_AT", direction: "DESC" },
} as const satisfies UserSearch;

/**
 * `$user` layout — auth gate + outlet only.
 * Profile search + Relay preload live on the index route.
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
 * Profile hub query.
 *
 * - `user` — people profiles (starred / followers / following).
 * - `repositoryOwner` — shared repos + public identity for **Users and Orgs**.
 *
 * Avoid `organization { … }`: those fields require `read:org` and GitHub
 * fails the *entire* operation when the token lacks that scope (even for
 * public orgs like firecrawl).
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
