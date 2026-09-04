import type { RepoArtifact, RepoPackageUnit } from "./types";

export const MONOREPO_PACKAGE_ROOTS = ["apps", "packages", "libs", "tools"] as const;

/**
 * True when `path` is a workspace package.json under apps/packages/libs/tools.
 *
 * @param path - Blob path from the git tree.
 */
export function isWorkspacePackageJson(path: string) {
  return MONOREPO_PACKAGE_ROOTS.some((root) =>
    new RegExp(`^${root}/[^/]+/package\\.json$`).test(path),
  );
}

/**
 * Finds a README.md directly inside a directory (case-insensitive).
 *
 * @param filePaths - Blob paths from the git tree.
 * @param dir - Directory relative to repo root (`"."` for root).
 */
export function findReadmeInDir(filePaths: string[], dir: string) {
  const prefix = dir === "." ? "" : `${dir.replace(/\/$/, "")}/`;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return filePaths.find((path) => new RegExp(`^${escaped}readme\\.md$`, "i").test(path)) ?? null;
}

/**
 * Classifies a package directory as app / package / other.
 *
 * @param dir - Directory relative to repo root.
 */
export function classifyPackageDir(dir: string): RepoPackageUnit["kind"] {
  if (dir === ".") return "root";
  const top = dir.split("/")[0]?.toLowerCase();
  if (top === "apps") return "app";
  if (top === "packages" || top === "libs" || top === "tools") return "package";
  return "other";
}

/**
 * Builds the display name for a workspace unit from package.json or folder name.
 *
 * @param dir - Directory relative to repo root.
 * @param parsed - Parsed package.json object when available.
 */
export function packageUnitName(dir: string, parsed: Record<string, unknown> | undefined) {
  if (typeof parsed?.name === "string" && parsed.name.trim()) {
    return parsed.name.trim();
  }
  if (dir === ".") return "root";
  return dir.split("/").filter(Boolean).pop() ?? dir;
}

/**
 * Builds package units (root + workspaces) from artifacts; READMEs filled by the caller.
 *
 * @param artifacts - Parsed manifests from spelunk.
 * @param filePaths - Blob paths (for README discovery).
 */
export function listPackageUnitDirs(
  artifacts: RepoArtifact[],
  filePaths: string[],
): Array<{
  dir: string;
  kind: RepoPackageUnit["kind"];
  name: string;
  description: string | null;
  readmePath: string | null;
}> {
  const packageJsonArtifacts = artifacts.filter((artifact) => artifact.kind === "package.json");
  const dirs = new Map<
    string,
    {
      dir: string;
      kind: RepoPackageUnit["kind"];
      name: string;
      description: string | null;
      readmePath: string | null;
    }
  >();

  const add = (packageJsonPath: string, parsed: Record<string, unknown> | undefined) => {
    const dir =
      packageJsonPath === "package.json" ? "." : packageJsonPath.replace(/\/package\.json$/, "");
    if (dirs.has(dir)) return;
    dirs.set(dir, {
      dir,
      kind: classifyPackageDir(dir),
      name: packageUnitName(dir, parsed),
      description: typeof parsed?.description === "string" ? parsed.description : null,
      readmePath: findReadmeInDir(filePaths, dir),
    });
  };

  // Always include root when a root package.json exists or a root README exists.
  const rootArtifact = packageJsonArtifacts.find((artifact) => artifact.path === "package.json");
  if (rootArtifact) {
    add("package.json", rootArtifact.parsed as Record<string, unknown> | undefined);
  } else if (findReadmeInDir(filePaths, ".")) {
    add("package.json", undefined);
  }

  for (const artifact of packageJsonArtifacts) {
    if (artifact.path === "package.json") continue;
    if (!isWorkspacePackageJson(artifact.path)) continue;
    add(artifact.path, artifact.parsed as Record<string, unknown> | undefined);
  }

  // Prefer root first, then apps, then packages, alphabetical within.
  return [...dirs.values()].sort((a, b) => {
    if (a.dir === ".") return -1;
    if (b.dir === ".") return 1;
    if (a.kind !== b.kind) {
      const order = { root: 0, app: 1, package: 2, other: 3 } as const;
      return order[a.kind] - order[b.kind];
    }
    return a.dir.localeCompare(b.dir);
  });
}
