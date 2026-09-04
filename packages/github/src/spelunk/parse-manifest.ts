import type { ManifestCandidate, RepoArtifact } from "./types";
import { parseCargoToml } from "./parsers/cargo";
import { parseComposerJson } from "./parsers/composer";
import { parseCsproj } from "./parsers/dotnet";
import { parseGemfile } from "./parsers/gemfile";
import { parseGoMod } from "./parsers/go-mod";
import { parseGradle } from "./parsers/gradle";
import { parseMavenPom } from "./parsers/maven";
import { parsePackageJson } from "./parsers/package-json";
import { parsePythonManifest } from "./parsers/python";
import { parseSwiftPackage } from "./parsers/swift-pm";

/**
 * Runs the matching language parser for a discovered manifest candidate.
 */
export function parseManifest(candidate: ManifestCandidate, content: string): RepoArtifact | null {
  switch (candidate.kind) {
    case "package.json":
      return parsePackageJson(candidate.path, content);
    case "go.mod":
      return parseGoMod(candidate.path, content);
    case "pyproject.toml":
    case "requirements.txt":
    case "setup.py":
      return parsePythonManifest(candidate.path, content);
    case "Cargo.toml":
      return parseCargoToml(candidate.path, content);
    case "build.gradle":
    case "build.gradle.kts":
      return parseGradle(candidate.path, content);
    case "pom.xml":
      return parseMavenPom(candidate.path, content);
    case ".csproj":
      return parseCsproj(candidate.path, content);
    case "composer.json":
      return parseComposerJson(candidate.path, content);
    case "Gemfile":
      return parseGemfile(candidate.path, content);
    case "Package.swift":
      return parseSwiftPackage(candidate.path, content);
    default:
      return null;
  }
}
