import { print } from "graphql";
import type { GitHubClient } from "../client";
import { graphql, readFragment, type ResultOf, type VariablesOf } from "../graphql";
import { SearchRepoFragment, SearchUserFragment } from "./fragments/search-results";

/**
 * GitHub search (Relay `SearchListQuery` + result fragments).
 */
export const SearchQuery = graphql(
  `
    query Search($query: String!, $type: SearchType!, $first: Int = 10) {
      search(first: $first, query: $query, type: $type) {
        codeCount
        discussionCount
        issueCount
        repositoryCount
        userCount
        wikiCount
        edges {
          cursor
          node {
            __typename
            ...SearchRepo
            ...SearchUser
          }
        }
      }
    }
  `,
  [SearchRepoFragment, SearchUserFragment],
);

export type SearchQueryResult = ResultOf<typeof SearchQuery>;
export type SearchVariables = VariablesOf<typeof SearchQuery>;

export const SEARCH_QUERY = print(SearchQuery);

/**
 * Runs a GitHub search and unmasks repo/user hit fragments by `__typename`.
 */
export async function searchGithub(this: GitHubClient, variables: SearchVariables) {
  const result = await this.graphql<SearchQueryResult>(SEARCH_QUERY, { variables });
  const search = result.search;

  return {
    codeCount: search.codeCount,
    discussionCount: search.discussionCount,
    issueCount: search.issueCount,
    repositoryCount: search.repositoryCount,
    userCount: search.userCount,
    wikiCount: search.wikiCount,
    edges: (search.edges ?? []).map((edge) => {
      const node = edge?.node;
      if (!node) {
        return { cursor: edge?.cursor ?? null, repository: null, user: null };
      }

      if (node.__typename === "Repository") {
        return {
          cursor: edge?.cursor ?? null,
          repository: readFragment(SearchRepoFragment, node),
          user: null,
        };
      }

      if (node.__typename === "User") {
        return {
          cursor: edge?.cursor ?? null,
          repository: null,
          user: readFragment(SearchUserFragment, node),
        };
      }

      return { cursor: edge?.cursor ?? null, repository: null, user: null };
    }),
  };
}
