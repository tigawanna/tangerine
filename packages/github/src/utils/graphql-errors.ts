import { RequestError } from "octokit";
import type { GithubGraphqlError } from "../types";

const ORG_PAT_POLICY_MARKERS = [
  "forbids access via a personal access token",
  "token's lifetime is greater than",
] as const;

function looksLikeRateLimitMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("secondary rate") ||
    lower.includes("api rate limit")
  );
}

/**
 * True when an Octokit/GraphQL failure is a primary or secondary rate limit
 * (HTTP 429/403, GraphQL `RATE_LIMITED` / rate-limit message in the body,
 * or a caller result envelope `{ error: "429" }`).
 */
export function isGithubRateLimited(error: unknown): boolean {
  if (error instanceof RequestError) {
    if (error.status === 429) return true;
    if (error.status === 403 && looksLikeRateLimitMessage(error.message)) return true;
  }

  if (error && typeof error === "object") {
    // Soft result envelopes from app helpers: `{ data: null, error: "429" }`.
    if ("error" in error && (error as { error?: unknown }).error === "429") {
      return true;
    }

    // GraphQL success bodies that still carry `errors: [{ type: "RATE_LIMITED", ... }]`.
    if ("errors" in error) {
      const errors = (error as { errors?: unknown }).errors;
      if (Array.isArray(errors)) {
        for (const entry of errors) {
          if (!entry || typeof entry !== "object") continue;
          const row = entry as { type?: string; message?: string; extensions?: { code?: string } };
          const code = (row.type ?? row.extensions?.code ?? "").toUpperCase();
          if (code === "RATE_LIMITED" || code === "RATE_LIMIT") return true;
          if (row.message && looksLikeRateLimitMessage(row.message)) return true;
        }
      }
    }
  }

  const aggregate = parseGraphqlAggregateError(error);
  if (aggregate?.some((entry) => looksLikeRateLimitMessage(entry.message))) {
    return true;
  }

  return false;
}

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
