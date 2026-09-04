import type { RepoArtifact } from "../types";

const MAX_PACKAGE_JSON_CHARS = 6_000;

/**
 * Builds a compact text summary from a package.json object for AI + embeddings.
 */
export function summarizePackageJson(path: string, content: Record<string, unknown>) {
  const dependencies =
    content.dependencies && typeof content.dependencies === "object"
      ? Object.keys(content.dependencies as Record<string, string>)
      : [];
  const devDependencies =
    content.devDependencies && typeof content.devDependencies === "object"
      ? Object.keys(content.devDependencies as Record<string, string>)
      : [];
  const scripts =
    content.scripts && typeof content.scripts === "object"
      ? Object.keys(content.scripts as Record<string, string>)
      : [];

  const parts = [
    `Package: ${path}`,
    typeof content.name === "string" ? `name: ${content.name}` : null,
    typeof content.description === "string" ? `description: ${content.description}` : null,
    dependencies.length > 0 ? `dependencies: ${dependencies.slice(0, 40).join(", ")}` : null,
    devDependencies.length > 0
      ? `devDependencies: ${devDependencies.slice(0, 25).join(", ")}`
      : null,
    scripts.length > 0 ? `scripts: ${scripts.slice(0, 20).join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join("\n").slice(0, MAX_PACKAGE_JSON_CHARS);
}

/**
 * Parses a package.json file into a RepoArtifact.
 */
export function parsePackageJson(path: string, content: string): RepoArtifact | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      language: "javascript",
      kind: "package.json",
      path,
      summary: summarizePackageJson(path, parsed),
      parsed,
    };
  } catch {
    return null;
  }
}
