import { LoadMoreButton } from "@/lib/relay/LoadMoreButton";
import { RepoCard } from "@/routes/_dashboard/-components/repo/RepoCard";
import type { layoutUserPageLoaderQuery } from "@/routes/_dashboard/$user/__generated__/layoutUserPageLoaderQuery.graphql";
import { useEffect } from "react";
import { graphql, usePaginationFragment } from "react-relay";
import type { UserRepos_repositories$key } from "./__generated__/UserRepos_repositories.graphql";
import type { SelectableRepo } from "./use-repo-selector";

export type RepoListEdge = {
  node?: {
    id: string;
    name: string;
    nameWithOwner: string;
    viewerPermission?: string | null;
  } | null;
} | null | undefined;

interface UserReposProps {
  userReposKey: UserRepos_repositories$key;
  editing: boolean;
  selected: SelectableRepo[];
  selectItem: (item: SelectableRepo) => void;
  unselectItem: (item: SelectableRepo) => void;
  onEdgesReady: (edges: ReadonlyArray<RepoListEdge>) => void;
}

/**
 * Paginated repositories for the profile Repos tab.
 * Filters + bulk-edit chrome live on `UserPage` (outside Suspense).
 */
export function UserRepos({
  userReposKey,
  editing,
  selected,
  selectItem,
  unselectItem,
  onEdgesReady,
}: UserReposProps) {
  const frag = usePaginationFragment<layoutUserPageLoaderQuery, UserRepos_repositories$key>(
    RepositoriesFragment,
    userReposKey,
  );
  const edges = frag.data.repositories.edges ?? [];

  useEffect(() => {
    onEdgesReady(edges);
  }, [edges, onEdgesReady]);

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
          const node = edge.node;
          const canSelect = node.viewerPermission === "ADMIN";
          const isSelected = selected.some((item) => item.id === node.id);

          return (
            <li key={node.id} className="min-w-0">
              <RepoCard
                repository={node}
                editing={editing}
                selected={isSelected}
                canSelect={canSelect}
                onToggleSelect={() => {
                  const item = {
                    id: node.id,
                    name: node.name,
                    nameWithOwner: node.nameWithOwner,
                  };
                  if (isSelected) {
                    unselectItem(item);
                  } else {
                    selectItem(item);
                  }
                }}
              />
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
          name
          nameWithOwner
          viewerPermission
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
