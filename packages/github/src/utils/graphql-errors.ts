import type { GithubGraphqlError } from "../types";

const ORG_PAT_POLICY_MARKERS = [
  "forbids access via a personal access token",
  "token's lifetime is greater than",
] as const;

/**
 * Returns true when a GraphQL error reflects an org PAT lifetime policy block.
 *
 * @param message - GraphQL or Octokit error message text.
 */
export function isOrgPatPolicyError(message: string): boolean {
  const haystack = message.toLowerCase();
  return ORG_PAT_POLICY_MARKERS.every((marker) => haystack.includes(marker.toLowerCase()));
}

/**
 * Parses Octokit aggregate GraphQL failures into structured error objects.
 *
 * @param error - Thrown request error from Octokit GraphQL.
 * @returns Parsed GraphQL errors, or null when the shape is unrecognized.
 */
export function parseGraphqlAggregateError(error: unknown): GithubGraphqlError[] | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (!error.message.includes("Request failed due to following response errors")) {
    return null;
  }

  const errors: GithubGraphqlError[] = [];

  for (const line of error.message.split("\n").slice(1)) {
    const trimmed = line.replace(/^\s*-\s*/, "").trim();
    if (trimmed) {
      errors.push({
        message: trimmed,
        path: [],
        extensions: { code: "", typeName: "", fieldName: "" },
        locations: [],
      });
    }
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Returns true when an Octokit GraphQL failure only contains ignorable org PAT policy errors.
 *
 * @param error - Thrown request error from Octokit GraphQL.
 */
export function isIgnorableGraphqlAggregateError(error: unknown): boolean {
  const errors = parseGraphqlAggregateError(error);
  return (
    errors != null &&
    errors.length > 0 &&
    errors.every((entry) => isOrgPatPolicyError(entry.message))
  );
}
