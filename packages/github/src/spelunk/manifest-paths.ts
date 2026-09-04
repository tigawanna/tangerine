import { isWorkspacePackageJson } from "./package-units";
import type { ManifestCandidate } from "./types";

const MAX_MANIFESTS = 20;

/**
 * Discovers language manifest candidates from a flat list of blob paths.
 * Caps at {@link MAX_MANIFESTS} to bound GitHub content fetches.
 */
export function discoverManifestCandidates(filePaths: string[]): ManifestCandidate[] {
  const candidates: ManifestCandidate[] = [];
  const seen = new Set<string>();

  const add = (candidate: ManifestCandidate) => {
    if (seen.has(candidate.path) || candidates.length >= MAX_MANIFESTS) {
      return;
    }
    seen.add(candidate.path);
    candidates.push(candidate);
  };

  for (const path of filePaths) {
    const base = path.split("/").pop() ?? path;

    if (base === "package.json") {
      if (path === "package.json" || isWorkspacePackageJson(path)) {
        add({ language: "javascript", kind: "package.json", path });
      }
      continue;
    }
    if (base === "go.mod") {
      add({ language: "go", kind: "go.mod", path });
      continue;
    }
    if (base === "pyproject.toml" || base === "requirements.txt" || base === "setup.py") {
      add({ language: "python", kind: base, path });
      continue;
    }
    if (base === "Cargo.toml") {
      add({ language: "rust", kind: "Cargo.toml", path });
      continue;
    }
    if (base === "build.gradle" || base === "build.gradle.kts") {
      add({ language: "kotlin", kind: base, path });
      continue;
    }
    if (base === "pom.xml") {
      add({ language: "java", kind: "pom.xml", path });
      continue;
    }
    if (base.endsWith(".csproj")) {
      add({ language: "csharp", kind: ".csproj", path });
      continue;
    }
    if (base === "composer.json") {
      add({ language: "php", kind: "composer.json", path });
      continue;
    }
    if (base === "Gemfile") {
      add({ language: "ruby", kind: "Gemfile", path });
      continue;
    }
    if (base === "Package.swift") {
      add({ language: "swift", kind: "Package.swift", path });
    }
  }

  return candidates;
}
