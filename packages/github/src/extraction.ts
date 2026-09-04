import type { GithubRepoSnapshot, PackageJsonChunk, RepoExtraction } from "./types";
import type { GitHubClient } from "./client";
import { collectArtifacts } from "./spelunk/collect-artifacts";
import { summarizePackageJson } from "./spelunk/parsers/package-json";

export { summarizePackageJson };

/**
 * Returns the root `package.json` content when present in extraction chunks.
 */
export function getRootPackageJson(chunks: PackageJsonChunk[]) {
  return chunks.find((chunk) => chunk.path === "package.json")?.content ?? null;
}

/**
 * Returns nested workspace package.json chunks (excludes the repo root).
 */
export function getWorkspacePackageChunks(chunks: PackageJsonChunk[]) {
  return chunks.filter((chunk) => chunk.path !== "package.json");
}

/**
 * Heuristic: repo has at least one workspace package under apps/packages/libs/tools.
 */
export function isMonorepoExtraction(extraction: Pick<RepoExtraction, "packageJsonChunks">) {
  return getWorkspacePackageChunks(extraction.packageJsonChunks).length > 0;
}

/**
 * Heuristic: does the README contain enough prose to count as a description?
 */
export function readmeHasDescription(readme: string) {
  return readme.split("\n").some((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 40 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("![") &&
      !trimmed.startsWith("|") &&
      !trimmed.startsWith("```")
    );
  });
}

/**
 * Heuristic: does the README mention tags or topics?
 */
export function readmeHasTags(readme: string) {
  return /\b(tags?|topics?)\s*:/i.test(readme) || /(^|\s)#[\w-]+/m.test(readme);
}

/**
 * Fetches README and nested package.json files from a GitHub repository.
 * @deprecated Prefer {@link collectArtifacts} from `./spelunk` — kept for site migration.
 */
export async function fetchRepoExtraction(
  client: GitHubClient,
  repo: GithubRepoSnapshot,
): Promise<RepoExtraction> {
  const spelunk = await collectArtifacts(client, repo);
  const packageJsonChunks: PackageJsonChunk[] = spelunk.artifacts
    .filter((artifact) => artifact.kind === "package.json" && artifact.parsed)
    .map((artifact) => ({
      path: artifact.path,
      content: artifact.parsed as Record<string, unknown>,
    }));

  return {
    filePaths: spelunk.filePaths,
    readme: spelunk.readme,
    readmePath: spelunk.readmePath,
    packageJsonChunks,
  };
}

/**
 * Fetches file paths and root package.json for lightweight repo analysis.
 */
export async function fetchRepoAnalysis(client: GitHubClient, repo: GithubRepoSnapshot) {
  const spelunk = await collectArtifacts(client, repo);
  const root = spelunk.artifacts.find((artifact) => artifact.path === "package.json");
  return {
    filePaths: spelunk.filePaths,
    packageJson: (root?.parsed as Record<string, unknown> | undefined) ?? null,
  };
}
