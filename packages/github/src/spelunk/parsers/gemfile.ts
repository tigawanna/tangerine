import type { RepoArtifact } from "../types";

/**
 * Parses a Gemfile into a RepoArtifact.
 */
export function parseGemfile(path: string, content: string): RepoArtifact | null {
  const gems = [...content.matchAll(/^\s*gem\s+["']([^"']+)["']/gm)].map((m) => m[1]!).slice(0, 40);
  const rubyVersion = content.match(/^\s*ruby\s+["']([^"']+)["']/m)?.[1] ?? null;
  const source = content.match(/^\s*source\s+["']([^"']+)["']/m)?.[1] ?? null;

  if (gems.length === 0 && !rubyVersion) {
    return null;
  }

  const parts = [
    `Ruby Gemfile: ${path}`,
    rubyVersion ? `ruby: ${rubyVersion}` : null,
    source ? `source: ${source}` : null,
    gems.length > 0 ? `gems: ${gems.join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "ruby",
    kind: "Gemfile",
    path,
    summary: parts.join("\n"),
    parsed: { rubyVersion, source, gems },
  };
}
