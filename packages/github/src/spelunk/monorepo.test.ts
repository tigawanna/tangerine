import { describe, expect, it } from "vitest";
import { detectMonorepoKind } from "./detect-monorepo";
import { findReadmeInDir, listPackageUnitDirs } from "./package-units";
import type { RepoArtifact } from "./types";

describe("detectMonorepoKind", () => {
  it("detects turborepo from turbo.json", () => {
    expect(detectMonorepoKind(["turbo.json", "package.json", "apps/web/package.json"])).toEqual({
      isMonorepo: true,
      kind: "turbo",
    });
  });

  it("detects pnpm from pnpm-workspace.yaml", () => {
    expect(detectMonorepoKind(["pnpm-workspace.yaml", "packages/ui/package.json"])).toEqual({
      isMonorepo: true,
      kind: "pnpm",
    });
  });

  it("detects npm workspaces from root package.json", () => {
    const artifacts: RepoArtifact[] = [
      {
        language: "javascript",
        kind: "package.json",
        path: "package.json",
        summary: "",
        parsed: { name: "root", workspaces: ["apps/*"] },
      },
    ];
    expect(detectMonorepoKind(["package.json"], artifacts)).toEqual({
      isMonorepo: true,
      kind: "npm",
    });
  });

  it("falls back to nested package.json heuristic", () => {
    const artifacts: RepoArtifact[] = [
      {
        language: "javascript",
        kind: "package.json",
        path: "package.json",
        summary: "",
        parsed: { name: "root" },
      },
      {
        language: "javascript",
        kind: "package.json",
        path: "apps/web/package.json",
        summary: "",
        parsed: { name: "web" },
      },
    ];
    expect(detectMonorepoKind(["package.json", "apps/web/package.json"], artifacts)).toEqual({
      isMonorepo: true,
      kind: "nested",
    });
  });

  it("returns false for single-package repos", () => {
    expect(
      detectMonorepoKind(
        ["package.json", "README.md"],
        [
          {
            language: "javascript",
            kind: "package.json",
            path: "package.json",
            summary: "",
            parsed: { name: "solo" },
          },
        ],
      ),
    ).toEqual({ isMonorepo: false, kind: null });
  });
});

describe("package units", () => {
  it("finds nested README paths", () => {
    expect(findReadmeInDir(["apps/web/README.md", "README.md"], "apps/web")).toBe(
      "apps/web/README.md",
    );
    expect(findReadmeInDir(["README.md"], ".")).toBe("README.md");
  });

  it("lists root and workspace package dirs", () => {
    const artifacts: RepoArtifact[] = [
      {
        language: "javascript",
        kind: "package.json",
        path: "package.json",
        summary: "",
        parsed: { name: "root", description: "Monorepo" },
      },
      {
        language: "javascript",
        kind: "package.json",
        path: "apps/web/package.json",
        summary: "",
        parsed: { name: "web" },
      },
      {
        language: "javascript",
        kind: "package.json",
        path: "packages/ui/package.json",
        summary: "",
        parsed: { name: "@repo/ui" },
      },
    ];

    const dirs = listPackageUnitDirs(artifacts, [
      "README.md",
      "apps/web/README.md",
      "packages/ui/package.json",
    ]);

    expect(dirs.map((d) => d.dir)).toEqual([".", "apps/web", "packages/ui"]);
    expect(dirs[0]?.readmePath).toBe("README.md");
    expect(dirs[1]?.readmePath).toBe("apps/web/README.md");
    expect(dirs[2]?.name).toBe("@repo/ui");
  });
});
