import type { RepoArtifact } from "../types";

/**
 * Parses a .csproj file into a RepoArtifact.
 */
export function parseCsproj(path: string, content: string): RepoArtifact | null {
  const targetFramework =
    content.match(/<TargetFramework>([^<]+)<\/TargetFramework>/)?.[1]?.trim() ??
    content.match(/<TargetFrameworks>([^<]+)<\/TargetFrameworks>/)?.[1]?.trim() ??
    null;
  const packages = [...content.matchAll(/<PackageReference\s+Include="([^"]+)"/g)]
    .map((m) => m[1]!)
    .slice(0, 40);
  const outputType = content.match(/<OutputType>([^<]+)<\/OutputType>/)?.[1]?.trim() ?? null;

  if (!targetFramework && packages.length === 0) {
    return null;
  }

  const parts = [
    `C# project: ${path}`,
    targetFramework ? `target: ${targetFramework}` : null,
    outputType ? `output: ${outputType}` : null,
    packages.length > 0 ? `packages: ${packages.join(", ")}` : null,
  ].filter((part): part is string => Boolean(part));

  return {
    language: "csharp",
    kind: ".csproj",
    path,
    summary: parts.join("\n"),
    parsed: { targetFramework, outputType, packages },
  };
}
