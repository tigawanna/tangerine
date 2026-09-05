import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { getRouteApi, Link } from "@tanstack/react-router";
import { graphql, useFragment, usePaginationFragment } from "react-relay";
import type { UserFollowersFragment$key } from "./__generated__/UserFollowersFragment.graphql";
import type { UserCard_user$key } from "./__generated__/UserCard_user.graphql";

const userRoute = getRouteApi("/_dashboard/$user/");

interface UserFollowersListProps {
  followersKey: UserFollowersFragment$key;
}

/**
 * Paginated followers list. `peopleQ` filters loaded cards client-side
 * (GitHub's followers connection has no search/order args).
 */
export function UserFollowersList({ followersKey }: UserFollowersListProps) {
  const { peopleQ } = userRoute.useSearch();
  const frag = usePaginationFragment<layoutUserPageLoaderQuery, UserFollowersFragment$key>(
    FollowersFragment,
    followersKey,
  );
  const edges = frag.data.followers.edges ?? [];
  const q = peopleQ.trim().toLowerCase();
  const visible = q
    ? edges.filter((edge) => {
        const node = edge?.node;
        if (!node) return false;
        const hay = `${node.login} ${node.name ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
    : edges;

  if (edges.length === 0) {
    return (
      <div
        className="border-base-300 text-base-content/70 rounded-xl border border-dashed p-8 text-sm"
        data-test="user-followers"
      >
        No followers found.
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div
        className="border-base-300 text-base-content/70 space-y-4 rounded-xl border border-dashed p-8 text-sm"
        data-test="user-followers"
      >
        <p>No loaded followers match “{peopleQ.trim()}”.</p>
        <p className="text-base-content/50 text-xs">
          Search only filters people already loaded — use Load more to fetch more.
        </p>
        <LoadMoreButton frag={frag} />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test="user-followers">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((edge) => {
          if (!edge?.node) return null;
          return (
            <li key={edge.cursor}>
              <UserCard user={edge.node} />
            </li>
          );
        })}
      </ul>
      <LoadMoreButton frag={frag} />
    </div>
  );
}

function UserCard({ user }: { user: UserCard_user$key }) {
  const data = useFragment(UserCardFragment, user);

  return (
    <Link
      to="/$user"
      params={{ user: data.login }}
      search={defaultUserSearch}
      className="border-base-300 bg-base-100 hover:border-base-content/20 flex items-center gap-3 rounded-xl border p-3 transition-colors"
      data-test={`user-card-${data.login}`}
    >
      <img
        src={data.avatarUrl}
        alt=""
        className="border-base-300 size-12 shrink-0 rounded-full border"
      />
      <div className="min-w-0">
        <p className="truncate font-medium">{data.name ?? data.login}</p>
        <p className="text-base-content/50 truncate text-sm">@{data.login}</p>
        {data.bio ? (
          <p className="text-base-content/60 mt-1 line-clamp-1 text-xs">{data.bio}</p>
        ) : null}
      </div>
    </Link>
  );
}

const FollowersFragment = graphql`
  fragment UserFollowersFragment on User
  @argumentDefinitions(first: { type: "Int", defaultValue: 12 }, after: { type: "String" })
  @refetchable(queryName: "FollowersPaginationQuery") {
    followers(first: $first, after: $after) @connection(key: "UserFollowersFragment_followers") {
      edges {
        cursor
        node {
          login
          name
          ...UserCard_user
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
  }
`;

const UserCardFragment = graphql`
  fragment UserCard_user on User {
    id
    name
    login
    bio
    avatarUrl
  }
`;

export { UserCard, UserCardFragment };
