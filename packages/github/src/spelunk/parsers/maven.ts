import type { RepoArtifact } from "../types";

/**
 * Parses a Maven pom.xml into a RepoArtifact.
 */
export function parseMavenPom(path: string, content: string): RepoArtifact | null {
  const artifactId = content.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1]?.trim() ?? null;
  const groupId = content.match(/<groupId>([^<]+)<\/groupId>/)?.[1]?.trim() ?? null;
  const name = content.match(/<name>([^<]+)<\/name>/)?.[1]?.trim() ?? null;
  const description = content.match(/<description>([^<]+)<\/description>/)?.[1]?.trim() ?? null;
  const deps = [...content.matchAll(/<dependency>[\s\S]*?<artifactId>([^<]+)<\/artifactId>/g)]
    .map((m) => m[1]!.trim())
    .slice(0, 40);

  if (!artifactId && deps.length === 0) {
    return null;
  }

  const parts = [
    `Maven project: ${path}`,
    groupId && artifactId ? `coords: ${groupId}:${artifactId}` : null,
    name ? `name: ${name}` : null,
    description ? `description: ${description.slice(0, 200)}` : null,
    deps.length > 0 ? `dependencies: ${deps.join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "java",
    kind: "pom.xml",
    path,
    summary: parts.join("\n"),
    parsed: { groupId, artifactId, name, description, dependencies: deps },
  };
}
