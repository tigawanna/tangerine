import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRepoNode } from "./test/fixtures";

const octokitMocks = vi.hoisted(() => ({
  graphql: vi.fn(),
  getTree: vi.fn(),
  getContent: vi.fn(),
  deleteRepo: vi.fn(),
  updateRepo: vi.fn(),
  replaceAllTopics: vi.fn(),
}));

vi.mock("octokit", () => {
  class RequestError extends Error {
    status: number;

    constructor(message: string, status: number, _options?: unknown) {
      super(message);
      this.name = "RequestError";
      this.status = status;
    }
  }

  return {
    RequestError,
    Octokit: class {
      graphql = octokitMocks.graphql;
      rest = {
        git: { getTree: octokitMocks.getTree },
        repos: {
          getContent: octokitMocks.getContent,
          delete: octokitMocks.deleteRepo,
          update: octokitMocks.updateRepo,
          replaceAllTopics: octokitMocks.replaceAllTopics,
        },
      };

      constructor(_options: { auth: string }) {}
    },
  };
});

import { createGitHubClient, RequestError } from "./client";
import {
  ENRICHMENT_RECENT_REPOS_QUERY,
  ONE_REPO_QUERY,
  PINNED_REPOS_QUERY,
  RECENT_REPOS_QUERY,
  REPO_BY_NAME_QUERY,
} from "./graphql/queries";

function createRequestError(status: number, message: string) {
  return new RequestError(message, status, {
    request: {
      method: "GET",
      url: "https://api.github.com/test",
      headers: {},
    },
  });
}

describe("GitHubClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates a client with the provided token", () => {
    expect(createGitHubClient("ghp_test_token")).toBeDefined();
  });

  it("forwards GraphQL cache and variable options", async () => {
    octokitMocks.graphql.mockResolvedValue({
      viewer: { repositories: { nodes: [] } },
    });

    const client = createGitHubClient("ghp_test_token");
    await client.graphql(RECENT_REPOS_QUERY, {
      cache: "no-store",
      variables: { first: 5 },
    });

    expect(octokitMocks.graphql).toHaveBeenCalledWith(RECENT_REPOS_QUERY, {
      first: 5,
      request: { cache: "no-store" },
    });
  });

  it("returns pinned repositories without null nodes", async () => {
    const pinnedRepo = createRepoNode({ name: "demo", nameWithOwner: "octocat/demo" });

    octokitMocks.graphql.mockResolvedValue({
      viewer: {
        pinnedItems: {
          nodes: [pinnedRepo, null],
        },
      },
    });

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getPinnedRepos()).resolves.toEqual([pinnedRepo]);
    expect(octokitMocks.graphql).toHaveBeenCalledWith(PINNED_REPOS_QUERY, {
      request: undefined,
    });
  });

  it("keeps partial recent repos when org PAT policy nulls individual nodes", async () => {
    const orgPolicyMessage =
      "The 'SpaceyaTech' organization forbids access via a personal access tokens (classic) if the token's lifetime is greater than 7 days.";
    const recentRepo = createRepoNode({ name: "recent", nameWithOwner: "octocat/recent" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            viewer: { repositories: { nodes: [recentRepo, null] } },
            rateLimit: null,
          },
          errors: [{ message: orgPolicyMessage }],
        }),
      }),
    );

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRecentRepos()).resolves.toEqual({
      data: {
        viewer: {
          pinnedItems: { nodes: [] },
          repositories: { nodes: [recentRepo] },
        },
      },
      errors: [expect.objectContaining({ message: orgPolicyMessage })],
      rateLimit: null,
    });

    vi.unstubAllGlobals();
  });

  it("returns null data when recent-repos GraphQL HTTP fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRecentRepos()).resolves.toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: "Unauthorized",
          extensions: expect.objectContaining({ code: "HTTP_ERROR" }),
        }),
      ],
      rateLimit: null,
    });

    vi.unstubAllGlobals();
  });

  it("returns recent repositories in the viewer response shape", async () => {
    const recentRepo = createRepoNode({ name: "recent", nameWithOwner: "octocat/recent" });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          viewer: { repositories: { nodes: [recentRepo] } },
          rateLimit: {
            cost: 1,
            limit: 5000,
            remaining: 4999,
            used: 1,
            resetAt: "2026-01-01T01:00:00Z",
          },
        },
        errors: [{ message: "partial failure" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRecentRepos({ first: 25 })).resolves.toEqual({
      data: {
        viewer: {
          pinnedItems: { nodes: [] },
          repositories: { nodes: [recentRepo] },
        },
      },
      errors: [{ message: "partial failure" }],
      rateLimit: {
        cost: 1,
        limit: 5000,
        remaining: 4999,
        used: 1,
        resetAt: "2026-01-01T01:00:00Z",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/graphql",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
      }),
    );

    vi.unstubAllGlobals();
  });

  it("excludes private repositories from pinned results", async () => {
    const publicRepo = createRepoNode({
      name: "public",
      nameWithOwner: "octocat/public",
      isPrivate: false,
    });
    const privateRepo = createRepoNode({
      name: "private",
      nameWithOwner: "octocat/private",
      isPrivate: true,
    });

    octokitMocks.graphql.mockResolvedValue({
      viewer: { pinnedItems: { nodes: [publicRepo, privateRepo] } },
    });

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getPinnedRepos()).resolves.toEqual([publicRepo]);
  });

  it("excludes private repositories from recent results", async () => {
    const publicRepo = createRepoNode({
      name: "public",
      nameWithOwner: "octocat/public",
      isPrivate: false,
    });
    const privateRepo = createRepoNode({
      name: "private",
      nameWithOwner: "octocat/private",
      isPrivate: true,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            viewer: { repositories: { nodes: [publicRepo, privateRepo] } },
            rateLimit: null,
          },
          errors: [],
        }),
      }),
    );

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRecentRepos()).resolves.toEqual({
      data: {
        viewer: {
          pinnedItems: { nodes: [] },
          repositories: { nodes: [publicRepo] },
        },
      },
      errors: [],
      rateLimit: null,
    });

    vi.unstubAllGlobals();
  });

  it("excludes private repositories from indexing results", async () => {
    const publicRepo = createRepoNode({
      name: "public",
      nameWithOwner: "octocat/public",
      isPrivate: false,
    });
    const privateRepo = createRepoNode({
      name: "private",
      nameWithOwner: "octocat/private",
      isPrivate: true,
    });

    octokitMocks.graphql.mockResolvedValue({
      viewer: { repositories: { nodes: [publicRepo, privateRepo] } },
    });

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRecentReposForIndexing()).resolves.toEqual([publicRepo]);
  });

  it("returns repository detail from GraphQL", async () => {
    const repository = {
      id: "R_kgDOExample",
      name: "demo",
      nameWithOwner: "octocat/demo",
      description: "Demo repo",
      homepageUrl: null,
      openGraphImageUrl: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
      url: "https://github.com/octocat/demo",
      forkCount: 0,
      isPrivate: false,
      isFork: false,
      isEmpty: false,
      isTemplate: false,
      repositoryTopics: { edges: [] },
      languages: { edges: [], totalSize: 0 },
    };

    octokitMocks.graphql.mockResolvedValue({ repository });

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRepoDetail("octocat", "demo")).resolves.toEqual(repository);
    expect(octokitMocks.graphql).toHaveBeenCalledWith(ONE_REPO_QUERY, {
      owner: "octocat",
      repo: "demo",
      firstTopics: 10,
      firstLangs: 10,
      request: undefined,
    });
  });

  it("maps recent repositories into enrichment snapshots", async () => {
    octokitMocks.graphql.mockResolvedValue({
      viewer: {
        repositories: {
          nodes: [
            {
              id: "R_kgDOExample",
              name: "demo",
              nameWithOwner: "octocat/demo",
              description: "Demo repo",
              homepageUrl: "https://example.com",
              openGraphImageUrl: null,
              isPrivate: false,
              defaultBranchRef: { name: "main" },
              repositoryTopics: { nodes: [{ topic: { name: "api" } }] },
            },
            {
              id: "R_kgDOPrivate",
              name: "private",
              nameWithOwner: "octocat/private",
              description: null,
              homepageUrl: null,
              openGraphImageUrl: null,
              isPrivate: true,
              defaultBranchRef: { name: "main" },
              repositoryTopics: { nodes: [] },
            },
          ],
        },
      },
    });

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRecentRepoSnapshots(10)).resolves.toEqual([
      {
        id: "R_kgDOExample",
        name: "demo",
        nameWithOwner: "octocat/demo",
        description: "Demo repo",
        homepageUrl: "https://example.com",
        openGraphImageUrl: null,
        topics: ["api"],
        defaultBranch: "main",
      },
    ]);
    expect(octokitMocks.graphql).toHaveBeenCalledWith(ENRICHMENT_RECENT_REPOS_QUERY, {
      first: 10,
      request: undefined,
    });
  });

  it("fetches snapshots by full name and skips invalid or private repos", async () => {
    octokitMocks.graphql
      .mockResolvedValueOnce({
        repository: {
          id: "R_kgDOExample",
          name: "demo",
          nameWithOwner: "octocat/demo",
          description: "Demo repo",
          homepageUrl: null,
          openGraphImageUrl: null,
          isPrivate: false,
          defaultBranchRef: { name: "main" },
          repositoryTopics: { nodes: [{ topic: { name: "api" } }] },
        },
      })
      .mockResolvedValueOnce({
        repository: {
          id: "R_kgDOPrivate",
          name: "private",
          nameWithOwner: "octocat/private",
          description: null,
          homepageUrl: null,
          openGraphImageUrl: null,
          isPrivate: true,
          defaultBranchRef: { name: "main" },
          repositoryTopics: { nodes: [] },
        },
      });

    const client = createGitHubClient("ghp_test_token");
    await expect(
      client.getRepoSnapshotsByFullNames(["octocat/demo", "invalid", "octocat/private"]),
    ).resolves.toEqual([
      {
        id: "R_kgDOExample",
        name: "demo",
        nameWithOwner: "octocat/demo",
        description: "Demo repo",
        homepageUrl: null,
        openGraphImageUrl: null,
        topics: ["api"],
        defaultBranch: "main",
      },
    ]);

    expect(octokitMocks.graphql).toHaveBeenCalledTimes(2);
    expect(octokitMocks.graphql).toHaveBeenNthCalledWith(1, REPO_BY_NAME_QUERY, {
      owner: "octocat",
      name: "demo",
      request: undefined,
    });
    expect(octokitMocks.graphql).toHaveBeenNthCalledWith(2, REPO_BY_NAME_QUERY, {
      owner: "octocat",
      name: "private",
      request: undefined,
    });
  });

  it("returns null when a git tree is missing", async () => {
    octokitMocks.getTree.mockRejectedValue(createRequestError(404, "Not Found"));

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRepoTree("octocat", "demo", "main")).resolves.toBeNull();
  });

  it("rethrows non-404 git tree errors", async () => {
    octokitMocks.getTree.mockRejectedValue(createRequestError(403, "Forbidden"));

    const client = createGitHubClient("ghp_test_token");
    await expect(client.getRepoTree("octocat", "demo", "main")).rejects.toThrow("Forbidden");
  });

  it("decodes base64 file content and returns null for unsupported payloads", async () => {
    octokitMocks.getContent
      .mockResolvedValueOnce({
        data: {
          type: "file",
          encoding: "base64",
          content: btoa('{"name":"demo"}'),
        },
      })
      .mockResolvedValueOnce({ data: [{ type: "dir" }] })
      .mockRejectedValueOnce(createRequestError(404, "Not Found"));

    const client = createGitHubClient("ghp_test_token");

    await expect(
      client.getRepoFileContent("octocat", "demo", "package.json", "main"),
    ).resolves.toBe('{"name":"demo"}');
    await expect(client.getRepoFileContent("octocat", "demo", "src", "main")).resolves.toBeNull();
    await expect(
      client.getRepoFileContent("octocat", "demo", "missing.txt", "main"),
    ).resolves.toBeNull();
  });

  it("deletes repositories by full name", async () => {
    const client = createGitHubClient("ghp_test_token");
    await client.deleteRepo("octocat/demo");

    expect(octokitMocks.deleteRepo).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "demo",
    });
  });

  it("updates repository visibility", async () => {
    const client = createGitHubClient("ghp_test_token");
    await client.setRepoVisibility("octocat/demo", "private");

    expect(octokitMocks.updateRepo).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "demo",
      private: true,
      visibility: "private",
    });
  });

  it("applies repository metadata and topics", async () => {
    const client = createGitHubClient("ghp_test_token");
    await client.applyRepoMetadata("octocat/demo", {
      description: "Updated description",
      homepage: "",
      topics: ["react", "api"],
    });

    expect(octokitMocks.updateRepo).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "demo",
      description: "Updated description",
      homepage: undefined,
    });
    expect(octokitMocks.replaceAllTopics).toHaveBeenCalledWith({
      owner: "octocat",
      repo: "demo",
      names: ["react", "api"],
    });
  });
});
