import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { FollowBackAllButton } from "@/routes/_dashboard/$user/-components/user/FollowBackAllButton";
import { defaultUserSearch, resolveUserSearch } from "@/routes/_dashboard/$user/layout";
import { getRouteApi, Link } from "@tanstack/react-router";
import { graphql, useFragment, usePaginationFragment } from "react-relay";
import { FollowUserButton } from "../user/FollowUserButton";
import type { UserFollowersFragment$key } from "./__generated__/UserFollowersFragment.graphql";
import type { UserCard_user$key } from "./__generated__/UserCard_user.graphql";

const userRoute = getRouteApi("/_dashboard/$user/");

/** Matches `loadNext(12)` / fragment default — one “Follow back all” per loaded page. */
const FOLLOWERS_BATCH_SIZE = 12;

interface UserFollowersListProps {
  followersKey: UserFollowersFragment$key;
}

/**
 * Paginated followers list. `peopleQ` filters loaded cards client-side
 * (GitHub's followers connection has no search/order args).
 * Each loaded page of 12 gets a “Follow back all” for eligible users in that batch.
 */
export function UserFollowersList({ followersKey }: UserFollowersListProps) {
  const { peopleQ } = resolveUserSearch(userRoute.useSearch());
  const frag = usePaginationFragment<layoutUserPageLoaderQuery, UserFollowersFragment$key>(
    FollowersFragment,
    followersKey,
  );
  const edges = frag.data.followers.edges ?? [];
  const q = peopleQ.trim().toLowerCase();

  function matchesSearch(node: { login: string; name?: string | null }): boolean {
    if (!q) return true;
    const hay = `${node.login} ${node.name ?? ""}`.toLowerCase();
    return hay.includes(q);
  }

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

  const batches: NonNullable<(typeof edges)[number]>[][] = [];
  for (let i = 0; i < edges.length; i += FOLLOWERS_BATCH_SIZE) {
    const slice = edges.slice(i, i + FOLLOWERS_BATCH_SIZE).filter((edge) => edge != null);
    batches.push(slice);
  }

  const anyVisible = batches.some((batch) =>
    batch.some((edge) => edge.node && matchesSearch(edge.node)),
  );

  if (!anyVisible) {
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
    <div className="space-y-8" data-test="user-followers">
      {batches.map((batch, batchIndex) => {
        const visible = batch.filter((edge) => edge.node && matchesSearch(edge.node));
        if (visible.length === 0) return null;

        const followBackTargets = visible.flatMap((edge) => {
          const node = edge.node;
          if (!node) return [];
          if (node.isViewer || node.viewerIsFollowing || !node.isFollowingViewer) return [];
          return [{ id: node.id, login: node.login }];
        });

        return (
          <section
            key={`followers-batch-${batchIndex}`}
            className="space-y-3"
            data-test={`user-followers-batch-${batchIndex}`}
          >
            {followBackTargets.length > 0 ? (
              <div className="flex justify-end">
                <FollowBackAllButton targets={followBackTargets} batchIndex={batchIndex} />
              </div>
            ) : null}
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((edge) => {
                if (!edge.node) return null;
                return (
                  <li key={edge.cursor}>
                    <UserCard user={edge.node} />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      <LoadMoreButton frag={frag} />
    </div>
  );
}

function UserCard({ user }: { user: UserCard_user$key }) {
  const data = useFragment(UserCardFragment, user);

  return (
    <div
      className="border-base-300 bg-base-200 hover:bg-primary/20 flex items-center gap-3 rounded-xl border p-3 transition-colors"
      data-test={`user-card-${data.login}`}
    >
      <Link
        to="/$user"
        params={{ user: data.login }}
        search={defaultUserSearch}
        replace={false}
        className="flex min-w-0 flex-1 items-center gap-3"
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
      <FollowUserButton user={data} size="xs" className="shrink-0" />
    </div>
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
          id
          login
          name
          isViewer
          isFollowingViewer
          viewerIsFollowing
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
    ...FollowUserButton_user
  }
`;

export { UserCard, UserCardFragment };
