import { describe, expect, it } from "vitest";
import { createRepoNode } from "../test/fixtures";
import {
  buildRepoSearchText,
  extractRepoTags,
  filterRepoNodes,
  hasCustomSocialPreview,
  isRepoMetadataComplete,
  mapEnrichmentRepoNode,
  splitRepoFullName,
} from "./repo";

describe("splitRepoFullName", () => {
  it("splits owner and repo from a full name", () => {
    expect(splitRepoFullName("octocat/Hello-World")).toEqual({
      owner: "octocat",
      repo: "Hello-World",
    });
  });

  it("throws for invalid full names", () => {
    expect(() => splitRepoFullName("invalid")).toThrow("Invalid repository full name");
    expect(() => splitRepoFullName("/missing-owner")).toThrow("Invalid repository full name");
  });
});

describe("extractRepoTags", () => {
  it("returns topic names and filters empty values", () => {
    const repo = createRepoNode({
      name: "demo",
      nameWithOwner: "octocat/demo",
      repositoryTopics: {
        nodes: [{ topic: { name: "react" } }, { topic: { name: "" } }, { topic: { name: "api" } }],
      },
    });

    expect(extractRepoTags(repo)).toEqual(["react", "api"]);
  });

  it("returns an empty array when topics are missing", () => {
    const repo = createRepoNode({
      name: "demo",
      nameWithOwner: "octocat/demo",
      repositoryTopics: { nodes: [] },
    });

    expect(extractRepoTags(repo)).toEqual([]);
  });
});

describe("buildRepoSearchText", () => {
  it("builds a compact search document from repository metadata", () => {
    const repo = createRepoNode({
      name: "demo",
      nameWithOwner: "octocat/demo",
      description: "A demo repository",
      repositoryTopics: {
        nodes: [{ topic: { name: "react" } }, { topic: { name: "api" } }],
      },
    });

    expect(buildRepoSearchText(repo)).toBe(
      [
        "Repository: demo",
        "Full name: octocat/demo",
        "Description: A demo repository",
        "Tags: react, api",
      ].join("\n"),
    );
  });
});

describe("hasCustomSocialPreview", () => {
  it("detects GitHub-hosted social preview images", () => {
    expect(
      hasCustomSocialPreview("https://repository-images.githubusercontent.com/123/456-abc"),
    ).toBe(true);
    expect(hasCustomSocialPreview("https://opengraph.githubassets.com/1/repo.png")).toBe(false);
    expect(hasCustomSocialPreview(null)).toBe(false);
  });
});

describe("isRepoMetadataComplete", () => {
  it("requires both description and topics", () => {
    expect(
      isRepoMetadataComplete({
        description: "Ready",
        topics: ["typescript"],
      }),
    ).toBe(true);

    expect(
      isRepoMetadataComplete({
        description: "   ",
        topics: ["typescript"],
      }),
    ).toBe(false);

    expect(
      isRepoMetadataComplete({
        description: "Ready",
        topics: [],
      }),
    ).toBe(false);
  });
});

describe("mapEnrichmentRepoNode", () => {
  it("maps GraphQL enrichment nodes to repo snapshots", () => {
    expect(
      mapEnrichmentRepoNode({
        id: "R_kgDOExample",
        name: "demo",
        nameWithOwner: "octocat/demo",
        description: "Demo repo",
        homepageUrl: "https://example.com",
        openGraphImageUrl: "https://opengraph.githubassets.com/1/repo.png",
        defaultBranchRef: { name: "develop" },
        repositoryTopics: {
          nodes: [{ topic: { name: "react" } }, { topic: { name: "" } }],
        },
      }),
    ).toEqual({
      id: "R_kgDOExample",
      name: "demo",
      nameWithOwner: "octocat/demo",
      description: "Demo repo",
      homepageUrl: "https://example.com",
      openGraphImageUrl: "https://opengraph.githubassets.com/1/repo.png",
      topics: ["react"],
      defaultBranch: "develop",
    });
  });

  it("falls back to main when defaultBranchRef is missing", () => {
    expect(
      mapEnrichmentRepoNode({
        id: "R_kgDOExample",
        name: "demo",
        nameWithOwner: "octocat/demo",
        description: null,
        homepageUrl: null,
        openGraphImageUrl: null,
        defaultBranchRef: null,
        repositoryTopics: { nodes: [] },
      }).defaultBranch,
    ).toBe("main");
  });
});

describe("filterRepoNodes", () => {
  it("removes null nodes", () => {
    const nodes = [{ name: "a", isPrivate: false }, null, { name: "b", isPrivate: true }];
    expect(filterRepoNodes(nodes)).toEqual([
      { name: "a", isPrivate: false },
      { name: "b", isPrivate: true },
    ]);
  });

  it("can exclude private repositories", () => {
    const nodes = [
      { name: "public", isPrivate: false },
      { name: "private", isPrivate: true },
      null,
    ];

    expect(filterRepoNodes(nodes, { excludePrivate: true })).toEqual([
      { name: "public", isPrivate: false },
    ]);
  });
});
