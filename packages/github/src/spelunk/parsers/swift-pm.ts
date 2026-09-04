import type { RepoArtifact } from "../types";

/**
 * Parses a Package.swift file into a RepoArtifact.
 */
export function parseSwiftPackage(path: string, content: string): RepoArtifact | null {
  const name = content.match(/name:\s*"([^"]+)"/)?.[1] ?? null;
  const products = [...content.matchAll(/\.library\(\s*name:\s*"([^"]+)"/g)].map((m) => m[1]!);
  const deps = [...content.matchAll(/\.package\(\s*url:\s*"([^"]+)"/g)]
    .map((m) => m[1]!)
    .slice(0, 20);

  if (!name && products.length === 0 && deps.length === 0) {
    return null;
  }

  const parts = [
    `Swift package: ${path}`,
    name ? `name: ${name}` : null,
    products.length > 0 ? `products: ${products.join(", ")}` : null,
    deps.length > 0 ? `packages: ${deps.join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "swift",
    kind: "Package.swift",
    path,
    summary: parts.join("\n"),
    parsed: { name, products, packages: deps },
  };
}
