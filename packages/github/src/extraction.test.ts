import { describe, expect, it, vi } from "vitest";
import type { GitHubClient } from "./client";
import {
  fetchRepoAnalysis,
  fetchRepoExtraction,
  getRootPackageJson,
  getWorkspacePackageChunks,
  isMonorepoExtraction,
  readmeHasDescription,
  readmeHasTags,
  summarizePackageJson,
} from "./extraction";
import { createRepoSnapshot, createTreeEntry, toGithubBase64 } from "./test/fixtures";

function createMockClient() {
  const getRepoTree = vi.fn<GitHubClient["getRepoTree"]>();
  const getRepoFileContent = vi.fn<GitHubClient["getRepoFileContent"]>();

  return {
    client: { getRepoTree, getRepoFileContent } as unknown as GitHubClient,
    getRepoTree,
    getRepoFileContent,
  };
}

describe("package.json helpers", () => {
  it("returns the root package.json chunk", () => {
    const root = { name: "root" };
    expect(
      getRootPackageJson([
        { path: "apps/web/package.json", content: { name: "web" } },
        { path: "package.json", content: root },
      ]),
    ).toEqual(root);
  });

  it("returns workspace package chunks without the root", () => {
    const chunks = [
      { path: "package.json", content: { name: "root" } },
      { path: "apps/web/package.json", content: { name: "web" } },
    ];

    expect(getWorkspacePackageChunks(chunks)).toEqual([
      { path: "apps/web/package.json", content: { name: "web" } },
    ]);
    expect(isMonorepoExtraction({ packageJsonChunks: chunks })).toBe(true);
    expect(isMonorepoExtraction({ packageJsonChunks: [chunks[0]!] })).toBe(false);
  });
});

describe("summarizePackageJson", () => {
  it("summarizes package metadata for embeddings", () => {
    const summary = summarizePackageJson("apps/web/package.json", {
      name: "web",
      description: "Frontend app",
      dependencies: { react: "^19.0.0", zod: "^4.0.0" },
      devDependencies: { vitest: "^4.0.0" },
      scripts: { dev: "vite", build: "vite build" },
    });

    expect(summary).toContain("Package: apps/web/package.json");
    expect(summary).toContain("name: web");
    expect(summary).toContain("description: Frontend app");
    expect(summary).toContain("dependencies: react, zod");
    expect(summary).toContain("devDependencies: vitest");
    expect(summary).toContain("scripts: dev, build");
  });
});

describe("readme heuristics", () => {
  it("detects prose descriptions in README files", () => {
    expect(
      readmeHasDescription(
        "# Title\n\nThis project provides a production-ready API client for GitHub integrations.",
      ),
    ).toBe(true);
    expect(readmeHasDescription("# Title only")).toBe(false);
  });

  it("detects tag and topic mentions in README files", () => {
    expect(readmeHasDescription("short")).toBe(false);
    expect(readmeHasTags("Tags: react, node")).toBe(true);
    expect(readmeHasTags("Built with #typescript")).toBe(true);
    expect(readmeHasTags("No metadata here")).toBe(false);
  });
});

describe("fetchRepoExtraction", () => {
  it("collects root and workspace package.json files plus README content", async () => {
    const repo = createRepoSnapshot({ nameWithOwner: "octocat/monorepo" });
    const { client, getRepoTree, getRepoFileContent } = createMockClient();

    getRepoTree.mockResolvedValue([
      createTreeEntry("README.md"),
      createTreeEntry("package.json"),
      createTreeEntry("apps/web/package.json"),
      createTreeEntry("packages/github/package.json"),
      createTreeEntry("docs/guide.md"),
      createTreeEntry("src", "tree"),
    ]);

    getRepoFileContent.mockImplementation(async (_owner, _repo, path) => {
      if (path === "package.json") {
        return JSON.stringify({ name: "monorepo" });
      }
      if (path === "apps/web/package.json") {
        return JSON.stringify({ name: "web" });
      }
      if (path === "packages/github/package.json") {
        return JSON.stringify({ name: "@repo/github" });
      }
      if (path === "README.md") {
        return "# Monorepo\n\nA long-form description for the repository.";
      }
      return null;
    });

    const extraction = await fetchRepoExtraction(client, repo);

    expect(extraction.readmePath).toBe("README.md");
    expect(extraction.readme).toContain("long-form description");
    expect(extraction.packageJsonChunks.map((chunk) => chunk.path)).toEqual([
      "package.json",
      "apps/web/package.json",
      "packages/github/package.json",
    ]);
    expect(extraction.filePaths).toEqual([
      "README.md",
      "package.json",
      "apps/web/package.json",
      "packages/github/package.json",
      "docs/guide.md",
    ]);
  });

  it("ignores invalid package.json files", async () => {
    const repo = createRepoSnapshot({ nameWithOwner: "octocat/broken" });
    const { client, getRepoTree, getRepoFileContent } = createMockClient();

    getRepoTree.mockResolvedValue([createTreeEntry("package.json")]);
    getRepoFileContent.mockResolvedValue("{ not-json");

    const extraction = await fetchRepoExtraction(client, repo);

    expect(extraction.packageJsonChunks).toEqual([]);
    expect(extraction.readme).toBeNull();
  });
});

describe("fetchRepoAnalysis", () => {
  it("returns file paths and parsed root package.json", async () => {
    const repo = createRepoSnapshot({ nameWithOwner: "octocat/demo" });
    const { client, getRepoTree, getRepoFileContent } = createMockClient();

    getRepoTree.mockResolvedValue([
      createTreeEntry("package.json"),
      createTreeEntry("src/index.ts"),
    ]);
    getRepoFileContent.mockResolvedValue(JSON.stringify({ name: "demo", private: true }));

    await expect(fetchRepoAnalysis(client, repo)).resolves.toEqual({
      filePaths: ["package.json", "src/index.ts"],
      packageJson: { name: "demo", private: true },
    });
  });

  it("returns null package.json when content cannot be parsed", async () => {
    const repo = createRepoSnapshot({ nameWithOwner: "octocat/demo" });
    const { client, getRepoTree, getRepoFileContent } = createMockClient();

    getRepoTree.mockResolvedValue([createTreeEntry("package.json")]);
    getRepoFileContent.mockResolvedValue("not-json");

    await expect(fetchRepoAnalysis(client, repo)).resolves.toEqual({
      filePaths: ["package.json"],
      packageJson: null,
    });
  });

  it("limits file paths to 500 entries", async () => {
    const repo = createRepoSnapshot({ nameWithOwner: "octocat/huge" });
    const { client, getRepoTree } = createMockClient();

    getRepoTree.mockResolvedValue(
      Array.from({ length: 600 }, (_, index) => createTreeEntry(`file-${index}.txt`)),
    );

    const analysis = await fetchRepoAnalysis(client, repo);

    expect(analysis.filePaths).toHaveLength(500);
    expect(analysis.packageJson).toBeNull();
  });
});

describe("toGithubBase64 fixture", () => {
  it("round-trips through client decoding expectations", () => {
    expect(toGithubBase64('{"name":"demo"}')).toBe("eyJuYW1lIjoiZGVtbyJ9");
  });
});
