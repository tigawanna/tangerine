import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";
import { loadQuery } from "react-relay";
import { z } from "zod";
import { githubSearchTypes, resolveGithubSearch } from "../../-components/search/github-search";
import { SearchPage } from "./-components/SearchPage";
import {
  searchReposQuery,
  searchUsersQuery,
  type GithubSearchQueryRef,
} from "./-components/SearchList";
import type { SearchReposQuery } from "./-components/__generated__/SearchReposQuery.graphql";
import type { SearchUsersQuery } from "./-components/__generated__/SearchUsersQuery.graphql";

const searchParamsSchema = z.object({
  q: z.string().optional(),
  type: z.enum(githubSearchTypes).optional(),
});

/**
 * GitHub search — input chrome stays mounted; loader only starts the Relay
 * fetch so the nested Suspense boundary can show results.
 */
export const Route = createFileRoute("/_dashboard/$user/search/")({
  validateSearch: (search) => searchParamsSchema.parse(search),
  loaderDeps({ search }) {
    const resolved = resolveGithubSearch(search);
    return { q: resolved.q, type: resolved.type };
  },
  loader({ context, deps }): GithubSearchQueryRef | null {
    const q = deps.q.trim();
    if (!q) return null;
    if (deps.type === "USER") {
      return {
        kind: "USER",
        queryRef: loadQuery<SearchUsersQuery>(
          context.relayEnvironment!,
          searchUsersQuery,
          { query: q },
          { fetchPolicy: "store-or-network" },
        ),
      };
    }
    return {
      kind: "REPOSITORY",
      queryRef: loadQuery<SearchReposQuery>(
        context.relayEnvironment!,
        searchReposQuery,
        { query: q },
        { fetchPolicy: "store-or-network" },
      ),
    };
  },
  component: SearchPage,
  head: ({ params }) => ({
    meta: [
      {
        title: `Search · ${params.user} · ${AppConfig.name}`,
      },
    ],
  }),
});
