import type { RepoArtifact } from "../types";

/**
 * Parses a Cargo.toml file into a RepoArtifact.
 */
export function parseCargoToml(path: string, content: string): RepoArtifact | null {
  const name = content.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  const description = content.match(/^\s*description\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  const edition = content.match(/^\s*edition\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  const depsSection = content.match(/\[dependencies\]([\s\S]*?)(?:\n\[|$)/)?.[1] ?? "";
  const deps = depsSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0]!.trim())
    .slice(0, 40);

  if (!name && deps.length === 0) {
    return null;
  }

  const parts = [
    `Rust crate: ${path}`,
    name ? `name: ${name}` : null,
    description ? `description: ${description}` : null,
    edition ? `edition: ${edition}` : null,
    deps.length > 0 ? `dependencies: ${deps.join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "rust",
    kind: "Cargo.toml",
    path,
    summary: parts.join("\n"),
    parsed: { name, description, edition, dependencies: deps },
  };
}
