import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { RepoCard } from "@/routes/_dashboard/-components/repo/RepoCard";
import type { GithubSearchType } from "@/routes/_dashboard/-components/search/github-search";
import { UserCard } from "@/routes/_dashboard/$user/-components/followers/UserFollowersList";
import { defaultUserSearch } from "@/routes/_dashboard/$user/layout";
import { Link } from "@tanstack/react-router";
import { graphql, useFragment, usePreloadedQuery, type PreloadedQuery } from "react-relay";
import type { SearchListOrgCard_organization$key } from "./__generated__/SearchListOrgCard_organization.graphql";
import type { SearchReposQuery } from "./__generated__/SearchReposQuery.graphql";
import type { SearchUsersQuery, SearchUsersQuery$data } from "./__generated__/SearchUsersQuery.graphql";

export type GithubSearchQueryRef =
  | { kind: "REPOSITORY"; queryRef: PreloadedQuery<SearchReposQuery> }
  | { kind: "USER"; queryRef: PreloadedQuery<SearchUsersQuery> };

interface SearchListProps {
  queryRef: GithubSearchQueryRef;
}

/**
 * Relay search results. Must stay inside a Suspense boundary whose fallback
 * does not include the search input.
 */
export function SearchList({ queryRef }: SearchListProps) {
  if (queryRef.kind === "USER") {
    return <SearchUserResults queryRef={queryRef.queryRef} />;
  }
  return <SearchRepoResults queryRef={queryRef.queryRef} />;
}

function SearchRepoResults({ queryRef }: { queryRef: PreloadedQuery<SearchReposQuery> }) {
  const data = usePreloadedQuery<SearchReposQuery>(searchReposQuery, queryRef);
  const hits = (data.search.edges ?? []).flatMap((edge) => {
    const repository = edge?.node?.repository;
    if (!edge || !repository) return [];
    return [{ cursor: edge.cursor, repository }];
  });

  if (hits.length === 0) {
    return <SearchEmpty kind="repositories" />;
  }

  return (
    <div className="space-y-4" data-test="github-search-results">
      <p className="text-base-content/50 font-mono text-xs">
        {data.search.repositoryCount.toLocaleString()} repositories
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hits.map((hit) => (
          <li key={hit.cursor} className="min-w-0">
            <RepoCard repository={hit.repository} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchUserResults({ queryRef }: { queryRef: PreloadedQuery<SearchUsersQuery> }) {
  const data = usePreloadedQuery<SearchUsersQuery>(searchUsersQuery, queryRef);
  const hits = (data.search.edges ?? []).flatMap((edge) => {
    if (!edge?.node) return [];
    return [{ cursor: edge.cursor, node: edge.node }];
  });

  if (hits.length === 0) {
    return <SearchEmpty kind="users" />;
  }

  return (
    <div className="space-y-4" data-test="github-search-results">
      <p className="text-base-content/50 font-mono text-xs">
        {data.search.userCount.toLocaleString()} users
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hits.map((hit) => (
          <li key={hit.cursor} className="min-w-0">
            <SearchPersonHit node={hit.node} />
          </li>
        ))}
      </ul>
    </div>
  );
}

type SearchUserNode = NonNullable<
  NonNullable<NonNullable<SearchUsersQuery$data["search"]["edges"]>[number]>["node"]
>;

function SearchPersonHit({ node }: { node: SearchUserNode }) {
  if (node.user) {
    return <UserCard user={node.user} />;
  }
  if (node.organization) {
    return <OrgSearchCard organization={node.organization} />;
  }
  return null;
}

function OrgSearchCard({ organization }: { organization: SearchListOrgCard_organization$key }) {
  const data = useFragment(OrgCardFragment, organization);

  return (
    <Link
      to="/$user"
      params={{ user: data.login }}
      search={defaultUserSearch}
      className="border-base-300 bg-base-200 hover:bg-primary/20 flex items-center gap-3 rounded-xl border p-3 transition-colors"
      data-test={`org-card-${data.login}`}
    >
      <img
        src={data.avatarUrl}
        alt=""
        className="border-base-300 size-12 shrink-0 rounded-full border"
      />
      <div className="min-w-0">
        <p className="truncate font-medium">{data.name ?? data.login}</p>
        <p className="text-base-content/50 truncate text-sm">@{data.login}</p>
      </div>
    </Link>
  );
}

function SearchEmpty({ kind }: { kind: "repositories" | "users" }) {
  return (
    <Empty className="border-base-300 min-h-72 border border-dashed" data-test="github-search-empty">
      <EmptyHeader>
        <EmptyTitle>No matches</EmptyTitle>
        <EmptyDescription>GitHub didn’t return {kind} for this query.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function SearchResultsFallback({ searchType }: { searchType: GithubSearchType }) {
  if (searchType === "USER") {
    return (
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        data-test="github-search-pending"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <li
            key={index}
            className="border-base-300 bg-base-200/40 h-20 animate-pulse rounded-xl border"
          />
        ))}
      </ul>
    );
  }

  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      data-test="github-search-pending"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={index}
          className="border-base-300 bg-base-200/40 aspect-4/5 animate-pulse rounded-xl border"
        />
      ))}
    </ul>
  );
}

const OrgCardFragment = graphql`
  fragment SearchListOrgCard_organization on Organization {
    id
    login
    name
    avatarUrl
  }
`;

export const searchReposQuery = graphql`
  query SearchReposQuery($query: String!) {
    search(first: 24, query: $query, type: REPOSITORY) {
      repositoryCount
      edges {
        cursor
        node {
          ...RepoCard_repository @alias(as: "repository")
        }
      }
    }
  }
`;

export const searchUsersQuery = graphql`
  query SearchUsersQuery($query: String!) {
    search(first: 24, query: $query, type: USER) {
      userCount
      edges {
        cursor
        node {
          ...UserCard_user @alias(as: "user")
          ...SearchListOrgCard_organization @alias(as: "organization")
        }
      }
    }
  }
`;
