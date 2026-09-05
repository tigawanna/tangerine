import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import { RepoCard } from "@/routes/_dashboard/-components/repo/RepoCard";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { graphql, usePaginationFragment } from "react-relay";
import type { UserStarredRepos_repositories$key } from "./__generated__/UserStarredRepos_repositories.graphql";

interface UserStarredReposProps {
  starredReposKey: UserStarredRepos_repositories$key;
}

/**
 * Paginated starred repositories for the profile Starred tab.
 */
export function UserStarredRepos({ starredReposKey }: UserStarredReposProps) {
  const frag = usePaginationFragment<
    layoutUserPageLoaderQuery,
    UserStarredRepos_repositories$key
  >(UserStarredReposFragment, starredReposKey);
  const edges = frag.data.starredRepositories.edges ?? [];

  if (edges.length === 0) {
    return (
      <div className="border-base-300 text-base-content/70 rounded-xl border border-dashed p-8 text-sm">
        No starred repositories yet.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test="user-starred-repos">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {edges.map((edge) => {
          if (!edge?.node) return null;
          return (
            <li key={edge.node.id} className="min-w-0">
              <RepoCard repository={edge.node} />
            </li>
          );
        })}
      </ul>
      <LoadMoreButton frag={frag} />
    </div>
  );
}

const UserStarredReposFragment = graphql`
  fragment UserStarredRepos_repositories on User
  @argumentDefinitions(
    firstStarredRepos: { type: "Int", defaultValue: 24 }
    afterStarredRepo: { type: "String" }
    orderByStarredRepos: {
      type: "StarOrder"
      defaultValue: { field: STARRED_AT, direction: DESC }
    }
  )
  @refetchable(queryName: "StarredRepositoriesPaginationQuery") {
    starredRepositories(
      first: $firstStarredRepos
      after: $afterStarredRepo
      orderBy: $orderByStarredRepos
    ) @connection(key: "UserStarredRepos_starredRepositories") {
      totalCount
      edges {
        cursor
        node {
          id
          ...RepoCard_repository
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;
