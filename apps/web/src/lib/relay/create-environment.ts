import {
  clearClientGithubAccessToken,
  getClientGithubAccessToken,
} from "@/lib/relay/github-access-token";
import {
  Environment,
  Network,
  RecordSource,
  Store,
  type FetchFunction,
  type GraphQLResponse,
} from "relay-runtime";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const fetchGithubGraphQL: FetchFunction = async (params, variables) => {
  const accessToken = await getClientGithubAccessToken();

  const response = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed (${response.status})`);
  }

  return (await response.json()) as GraphQLResponse;
};

/**
 * Client-only Relay Environment pointed at GitHub GraphQL.
 * Uses a cached Better Auth account-cookie token (see github-access-token).
 */
export function createGithubRelayEnvironment(): Environment {
  return new Environment({
    network: Network.create(fetchGithubGraphQL),
    store: new Store(new RecordSource()),
  });
}

/** One Environment per browser tab for the dashboard session. */
let dashboardRelayEnvironment: Environment | null = null;

/**
 * Returns a stable Relay Environment for `/_dashboard`.
 * Reuses `existing` from router context when present, otherwise the module singleton.
 * Creating a new env per navigation breaks `loadQuery` + `usePreloadedQuery`.
 */
export function getGithubRelayEnvironment(existing?: Environment | null): Environment {
  if (existing) {
    dashboardRelayEnvironment = existing;
    return existing;
  }
  if (!dashboardRelayEnvironment) {
    dashboardRelayEnvironment = createGithubRelayEnvironment();
  }
  return dashboardRelayEnvironment;
}

/** Drop the cached env + token (e.g. after sign-out). */
export function resetGithubRelayEnvironment(): void {
  dashboardRelayEnvironment = null;
  clearClientGithubAccessToken();
}
