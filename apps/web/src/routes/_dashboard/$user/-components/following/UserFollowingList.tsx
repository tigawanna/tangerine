import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { getRouteApi } from "@tanstack/react-router";
import { graphql, usePaginationFragment } from "react-relay";
import { UserCard } from "../followers/UserFollowersList";
import type { UserFollowingFragment$key } from "./__generated__/UserFollowingFragment.graphql";

const userRoute = getRouteApi("/_dashboard/$user/");

interface UserFollowingListProps {
  followingKey: UserFollowingFragment$key;
}

/**
 * Paginated following list. `peopleQ` filters loaded cards client-side
 * (GitHub's following connection has no search/order args).
 */
export function UserFollowingList({ followingKey }: UserFollowingListProps) {
  const { peopleQ } = userRoute.useSearch();
  const frag = usePaginationFragment<layoutUserPageLoaderQuery, UserFollowingFragment$key>(
    FollowingFragment,
    followingKey,
  );
  const edges = frag.data.following.edges ?? [];
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
        data-test="user-following"
      >
        Not following anyone yet.
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div
        className="border-base-300 text-base-content/70 space-y-4 rounded-xl border border-dashed p-8 text-sm"
        data-test="user-following"
      >
        <p>No loaded people match “{peopleQ.trim()}”.</p>
        <p className="text-base-content/50 text-xs">
          Search only filters people already loaded — use Load more to fetch more.
        </p>
        <LoadMoreButton frag={frag} />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test="user-following">
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

const FollowingFragment = graphql`
  fragment UserFollowingFragment on User
  @argumentDefinitions(first: { type: "Int", defaultValue: 12 }, after: { type: "String" })
  @refetchable(queryName: "FollowingPaginationQuery") {
    following(first: $first, after: $after) @connection(key: "UserFollowingFragment_following") {
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
