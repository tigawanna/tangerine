import type { RepoArtifact } from "../types";

/**
 * Parses pyproject.toml, requirements.txt, or setup.py into a RepoArtifact.
 */
export function parsePythonManifest(path: string, content: string): RepoArtifact | null {
  const base = path.split("/").pop() ?? path;

  if (base === "pyproject.toml") {
    return parsePyproject(path, content);
  }
  if (base === "requirements.txt") {
    return parseRequirements(path, content);
  }
  if (base === "setup.py") {
    return parseSetupPy(path, content);
  }
  return null;
}

function parsePyproject(path: string, content: string): RepoArtifact {
  const name = content.match(/name\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
  const description = content.match(/description\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
  const deps = [...content.matchAll(/^\s*["']([a-zA-Z0-9_.-]+)[^"']*["']/gm)].map((m) => m[1]!);

  const parts = [
    `Python project: ${path}`,
    name ? `name: ${name}` : null,
    description ? `description: ${description}` : null,
    deps.length > 0 ? `dependencies: ${deps.slice(0, 40).join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "python",
    kind: "pyproject.toml",
    path,
    summary: parts.join("\n"),
    parsed: { name, description, dependencies: deps.slice(0, 40) },
  };
}

function parseRequirements(path: string, content: string): RepoArtifact {
  const deps = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
    .map((line) => line.split(/[<>=!~\s]/)[0]!)
    .filter(Boolean)
    .slice(0, 40);

  return {
    language: "python",
    kind: "requirements.txt",
    path,
    summary: [`Python requirements: ${path}`, `dependencies: ${deps.join(", ")}`].join("\n"),
    parsed: { dependencies: deps },
  };
}

function parseSetupPy(path: string, content: string): RepoArtifact {
  const name = content.match(/name\s*=\s*["']([^"']+)["']/)?.[1] ?? null;
  const description = content.match(/description\s*=\s*["']([^"']+)["']/)?.[1] ?? null;

  const parts = [
    `Python setup: ${path}`,
    name ? `name: ${name}` : null,
    description ? `description: ${description}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "python",
    kind: "setup.py",
    path,
    summary: parts.join("\n"),
    parsed: { name, description },
  };
}
