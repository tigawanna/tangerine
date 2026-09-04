import type { RepoArtifact } from "../types";

/**
 * Parses a composer.json file into a RepoArtifact.
 */
export function parseComposerJson(path: string, content: string): RepoArtifact | null {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const name = typeof parsed.name === "string" ? parsed.name : null;
    const description = typeof parsed.description === "string" ? parsed.description : null;
    const require =
      parsed.require && typeof parsed.require === "object"
        ? Object.keys(parsed.require as Record<string, string>).slice(0, 40)
        : [];

    const parts = [
      `PHP package: ${path}`,
      name ? `name: ${name}` : null,
      description ? `description: ${description}` : null,
      require.length > 0 ? `require: ${require.join(", ")}` : null,
    ].filter((part): part is string => Boolean(part));

    return {
      language: "php",
      kind: "composer.json",
      path,
      summary: parts.join("\n"),
      parsed: { name, description, require },
    };
  } catch {
    return null;
  }
}
