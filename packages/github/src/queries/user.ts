import { print } from "graphql";
import { graphql, type ResultOf } from "../graphql";
import type { GitHubClient } from "../client";

/**
 * Minimal authenticated-viewer probe used to validate the gql.tada setup.
 */
export const ViewerQuery = graphql(`
  query Viewer {
    viewer {
      login
      name
      avatarUrl
    }
  }
`);

export type ViewerQueryResult = ResultOf<typeof ViewerQuery>;

/** Printed GraphQL source for clients that only accept query strings (e.g. Octokit). */
export const VIEWER_QUERY = print(ViewerQuery);

/**
 * Fetches the authenticated GitHub viewer.
 */
export async function getViewer(this: GitHubClient) {
  const result = await this.graphql<ViewerQueryResult>(VIEWER_QUERY);
  return result.viewer;
}
