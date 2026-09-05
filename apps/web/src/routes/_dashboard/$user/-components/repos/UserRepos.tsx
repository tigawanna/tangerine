import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import { RepoCard } from "@/routes/_dashboard/-components/repo/RepoCard";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { graphql, usePaginationFragment } from "react-relay";
import type { UserRepos_repositories$key } from "./__generated__/UserRepos_repositories.graphql";

interface UserReposProps {
  userReposKey: UserRepos_repositories$key;
}

/**
 * Paginated repositories for the profile Repos tab.
 * Filters live on `UserPage` (outside Suspense).
 */
export function UserRepos({ userReposKey }: UserReposProps) {
  const frag = usePaginationFragment<layoutUserPageLoaderQuery, UserRepos_repositories$key>(
    RepositoriesFragment,
    userReposKey,
  );
  const edges = frag.data.repositories.edges ?? [];

  if (edges.length === 0) {
    return (
      <div
        className="border-base-300 text-base-content/70 rounded-xl border border-dashed p-8 text-sm"
        data-test="user-repos"
      >
        No repositories match these filters.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test="user-repos">
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

const RepositoriesFragment = graphql`
  fragment UserRepos_repositories on RepositoryOwner
  @argumentDefinitions(
    first: { type: "Int", defaultValue: 24 }
    after: { type: "String" }
    orderBy: { type: "RepositoryOrder", defaultValue: { field: PUSHED_AT, direction: DESC } }
    isFork: { type: "Boolean", defaultValue: false }
  )
  @refetchable(queryName: "UserReposPaginationQuery") {
    repositories(first: $first, after: $after, orderBy: $orderBy, isFork: $isFork)
      @connection(key: "UserRepos_repositories", filters: ["orderBy", "isFork"]) {
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
      totalCount
    }
  }
`;
