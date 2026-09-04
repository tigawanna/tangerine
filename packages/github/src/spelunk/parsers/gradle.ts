import type { RepoArtifact } from "../types";

/**
 * Parses build.gradle / build.gradle.kts into a RepoArtifact (Kotlin/Java).
 */
export function parseGradle(path: string, content: string): RepoArtifact | null {
  const isKotlinDsl = path.endsWith(".kts");
  const plugins = [
    ...content.matchAll(/id\(["']([^"']+)["']\)/g),
    ...content.matchAll(/id\s+["']([^"']+)["']/g),
  ].map((m) => m[1]!);
  const deps = [
    ...content.matchAll(/(?:implementation|api|compileOnly|runtimeOnly)\(["']([^"']+)["']\)/g),
  ]
    .map((m) => m[1]!)
    .slice(0, 40);

  if (plugins.length === 0 && deps.length === 0) {
    return null;
  }

  const language = content.includes("kotlin") || isKotlinDsl ? "kotlin" : "java";
  const parts = [
    `Gradle project: ${path}`,
    plugins.length > 0 ? `plugins: ${[...new Set(plugins)].slice(0, 15).join(", ")}` : null,
    deps.length > 0 ? `dependencies: ${deps.join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language,
    kind: isKotlinDsl ? "build.gradle.kts" : "build.gradle",
    path,
    summary: parts.join("\n"),
    parsed: { plugins: [...new Set(plugins)].slice(0, 15), dependencies: deps },
  };
}
