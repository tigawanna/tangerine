import type { GitHubClient } from "../client";
import type { GitTreeEntry, GithubRepoSnapshot } from "../types";
import { detectMonorepoKind } from "./detect-monorepo";
import { discoverManifestCandidates } from "./manifest-paths";
import { listPackageUnitDirs } from "./package-units";
import { parseManifest } from "./parse-manifest";
import type { RepoArtifact, RepoPackageUnit, SpelunkPayload } from "./types";

const MAX_README_CHARS = 8_000;
const MAX_FILE_PATHS = 500;

/**
 * Collects tree paths, README(s), parsed language manifests, and monorepo package units.
 * GitHub API only — no DB writes.
 */
export async function collectArtifacts(
  client: GitHubClient,
  repo: GithubRepoSnapshot,
): Promise<SpelunkPayload> {
  const { owner, repo: repoName } = splitRepoFullName(repo.nameWithOwner);
  const tree = await client.getRepoTree(owner, repoName, repo.defaultBranch, true);
  const filePaths =
    tree
      ?.filter((entry: GitTreeEntry) => entry.type === "blob")
      .map((entry) => entry.path)
      .slice(0, MAX_FILE_PATHS) ?? [];

  const candidates = discoverManifestCandidates(filePaths);
  const artifacts: RepoArtifact[] = [];

  for (const candidate of candidates) {
    const content = await client.getRepoFileContent(
      owner,
      repoName,
      candidate.path,
      repo.defaultBranch,
    );
    if (!content) {
      continue;
    }
    const artifact = parseManifest(candidate, content);
    if (artifact) {
      artifacts.push(artifact);
    }
  }

  const readmePath = findReadmePath(filePaths);
  let readme: string | null = null;
  if (readmePath) {
    const content = await client.getRepoFileContent(
      owner,
      repoName,
      readmePath,
      repo.defaultBranch,
    );
    if (content) {
      readme = content.slice(0, MAX_README_CHARS);
    }
  }

  const monorepo = detectMonorepoKind(filePaths, artifacts);
  const packages = await collectPackageUnits(
    client,
    owner,
    repoName,
    repo.defaultBranch,
    filePaths,
    artifacts,
    readme,
    readmePath,
  );

  return { filePaths, readme, readmePath, artifacts, monorepo, packages };
}

/**
 * Fetches nested package READMEs and builds {@link RepoPackageUnit} rows.
 */
async function collectPackageUnits(
  client: GitHubClient,
  owner: string,
  repoName: string,
  branch: string,
  filePaths: string[],
  artifacts: RepoArtifact[],
  rootReadme: string | null,
  rootReadmePath: string | null,
): Promise<RepoPackageUnit[]> {
  const dirs = listPackageUnitDirs(artifacts, filePaths);

  // Non-monorepo / no package.json: still surface the root README as a single unit.
  if (dirs.length === 0) {
    if (!rootReadme && !rootReadmePath) return [];
    return [
      {
        name: repoName,
        path: ".",
        kind: "root",
        description: null,
        readme: rootReadme,
        readmePath: rootReadmePath,
      },
    ];
  }

  const units: RepoPackageUnit[] = [];

  for (const entry of dirs) {
    let readme: string | null = null;
    let readmePath = entry.readmePath;

    if (entry.dir === "." && rootReadme) {
      readme = rootReadme;
      readmePath = rootReadmePath;
    } else if (readmePath) {
      const content = await client.getRepoFileContent(owner, repoName, readmePath, branch);
      if (content) {
        readme = content.slice(0, MAX_README_CHARS);
      }
    }

    units.push({
      name: entry.dir === "." ? entry.name || repoName : entry.name,
      path: entry.dir,
      kind: entry.kind,
      description: entry.description,
      readme,
      readmePath,
    });
  }

  return units;
}

/**
 * Finds the root README.md path (case-insensitive), if any.
 */
export function findReadmePath(filePaths: string[]) {
  return filePaths.find((path) => /^readme\.md$/i.test(path)) ?? null;
}

function splitRepoFullName(nameWithOwner: string) {
  const [owner, repoName] = nameWithOwner.split("/");
  if (!owner || !repoName) {
    throw new Error("Invalid repository full name");
  }
  return { owner, repo: repoName };
}
