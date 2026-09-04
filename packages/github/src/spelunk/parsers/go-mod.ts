import type { RepoArtifact } from "../types";

/**
 * Parses a go.mod file into a RepoArtifact.
 */
export function parseGoMod(path: string, content: string): RepoArtifact | null {
  const lines = content.split("\n").map((line) => line.trim());
  const moduleLine = lines.find((line) => line.startsWith("module "));
  const goLine = lines.find((line) => line.startsWith("go "));
  const requireCount = lines.filter(
    (line) => line.startsWith("require ") || /^\S+\s+v[\d.]/.test(line),
  ).length;

  if (!moduleLine && !goLine) {
    return null;
  }

  const module = moduleLine?.slice("module ".length).trim() ?? null;
  const goVersion = goLine?.slice("go ".length).trim() ?? null;

  const parts = [
    `Go module: ${path}`,
    module ? `module: ${module}` : null,
    goVersion ? `go: ${goVersion}` : null,
    requireCount > 0 ? `require lines: ${requireCount}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "go",
    kind: "go.mod",
    path,
    summary: parts.join("\n"),
    parsed: { module, goVersion, requireCount },
  };
}
