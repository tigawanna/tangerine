import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { graphql, usePaginationFragment } from "react-relay";
import { UserCard } from "../followers/UserFollowersList";
import type { UserFollowingFragment$key } from "./__generated__/UserFollowingFragment.graphql";

interface UserFollowingListProps {
  followingKey: UserFollowingFragment$key;
}

/**
 * Paginated following list for the profile Following tab.
 */
export function UserFollowingList({ followingKey }: UserFollowingListProps) {
  const frag = usePaginationFragment<layoutUserPageLoaderQuery, UserFollowingFragment$key>(
    FollowingFragment,
    followingKey,
  );
  const edges = frag.data.following.edges ?? [];

  if (edges.length === 0) {
    return (
      <div className="border-base-300 text-base-content/70 rounded-xl border border-dashed p-8 text-sm">
        Not following anyone yet.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test="user-following">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {edges.map((edge) => {
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
