import type { MonorepoDetection, MonorepoKind, RepoArtifact } from "./types";

/**
 * Infers monorepo tooling from tree paths and optional root package.json workspaces.
 *
 * @param filePaths - Blob paths from the git tree.
 * @param artifacts - Parsed manifests (used for root `workspaces` / `packageManager`).
 */
export function detectMonorepoKind(
  filePaths: string[],
  artifacts: RepoArtifact[] = [],
): MonorepoDetection {
  if (filePaths.some((path) => /^turbo\.json$/i.test(path))) {
    return { isMonorepo: true, kind: "turbo" satisfies MonorepoKind };
  }
  if (filePaths.some((path) => /^pnpm-workspace\.ya?ml$/i.test(path))) {
    return { isMonorepo: true, kind: "pnpm" };
  }
  if (filePaths.some((path) => /^lerna\.json$/i.test(path))) {
    return { isMonorepo: true, kind: "lerna" };
  }
  if (filePaths.some((path) => /^nx\.json$/i.test(path))) {
    return { isMonorepo: true, kind: "nx" };
  }

  const rootPkg = artifacts.find((artifact) => artifact.path === "package.json");
  const parsed = rootPkg?.parsed;
  if (parsed && typeof parsed === "object") {
    const workspaces = parsed.workspaces;
    const hasWorkspaces =
      (Array.isArray(workspaces) && workspaces.length > 0) ||
      (workspaces !== null &&
        typeof workspaces === "object" &&
        Array.isArray((workspaces as { packages?: unknown }).packages) &&
        ((workspaces as { packages: unknown[] }).packages?.length ?? 0) > 0);

    if (hasWorkspaces) {
      const packageManager =
        typeof parsed.packageManager === "string" ? parsed.packageManager.toLowerCase() : "";
      if (packageManager.startsWith("yarn")) {
        return { isMonorepo: true, kind: "yarn" };
      }
      if (packageManager.startsWith("pnpm")) {
        return { isMonorepo: true, kind: "pnpm" };
      }
      return { isMonorepo: true, kind: "npm" };
    }
  }

  const nestedPackageJson = artifacts.some(
    (artifact) => artifact.kind === "package.json" && artifact.path !== "package.json",
  );
  if (nestedPackageJson) {
    return { isMonorepo: true, kind: "nested" };
  }

  return { isMonorepo: false, kind: null };
}
