import { describe, expect, it } from "vitest";
import {
  isIgnorableGraphqlAggregateError,
  isOrgPatPolicyError,
  parseGraphqlAggregateError,
} from "./graphql-errors";

const orgPolicyMessage =
  "The 'SpaceyaTech' organization forbids access via a personal access tokens (classic) if the token's lifetime is greater than 7 days. Please adjust your token's lifetime at the following URL: https://github.com/settings/tokens/4801076191";

describe("isOrgPatPolicyError", () => {
  it("detects org PAT lifetime policy messages", () => {
    expect(isOrgPatPolicyError(orgPolicyMessage)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isOrgPatPolicyError("Resource not accessible by personal access token")).toBe(false);
  });
});

describe("parseGraphqlAggregateError", () => {
  it("parses Octokit aggregate GraphQL failures", () => {
    const error = new Error(
      `Request failed due to following response errors:\n - ${orgPolicyMessage}\n - ${orgPolicyMessage}`,
    );

    expect(parseGraphqlAggregateError(error)).toEqual([
      { message: orgPolicyMessage, path: [], extensions: expect.any(Object), locations: [] },
      { message: orgPolicyMessage, path: [], extensions: expect.any(Object), locations: [] },
    ]);
  });

  it("returns null for non-aggregate errors", () => {
    expect(parseGraphqlAggregateError(new Error("Network failure"))).toBeNull();
    expect(parseGraphqlAggregateError("not an error")).toBeNull();
  });
});

describe("isIgnorableGraphqlAggregateError", () => {
  it("returns true when every parsed error is an org PAT policy failure", () => {
    const error = new Error(
      `Request failed due to following response errors:\n - ${orgPolicyMessage}`,
    );

    expect(isIgnorableGraphqlAggregateError(error)).toBe(true);
  });

  it("returns false when any parsed error is unrelated", () => {
    const error = new Error(
      "Request failed due to following response errors:\n - Resource not accessible by personal access token",
    );

    expect(isIgnorableGraphqlAggregateError(error)).toBe(false);
  });
});
