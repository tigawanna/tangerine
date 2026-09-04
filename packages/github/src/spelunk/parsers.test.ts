import { describe, expect, it } from "vitest";
import { discoverManifestCandidates } from "./manifest-paths";
import { parseCargoToml } from "./parsers/cargo";
import { parseComposerJson } from "./parsers/composer";
import { parseCsproj } from "./parsers/dotnet";
import { parseGemfile } from "./parsers/gemfile";
import { parseGoMod } from "./parsers/go-mod";
import { parseGradle } from "./parsers/gradle";
import { parseMavenPom } from "./parsers/maven";
import { parsePackageJson, summarizePackageJson } from "./parsers/package-json";
import { parsePythonManifest } from "./parsers/python";
import { parseSwiftPackage } from "./parsers/swift-pm";

describe("discoverManifestCandidates", () => {
  it("finds root and workspace package.json plus other stacks", () => {
    const candidates = discoverManifestCandidates([
      "package.json",
      "apps/web/package.json",
      "src/index.ts",
      "go.mod",
      "pyproject.toml",
      "Cargo.toml",
      "build.gradle.kts",
      "pom.xml",
      "App.csproj",
      "composer.json",
      "Gemfile",
      "Package.swift",
      "nested/deep/package.json",
    ]);

    expect(candidates.map((c) => c.path)).toEqual([
      "package.json",
      "apps/web/package.json",
      "go.mod",
      "pyproject.toml",
      "Cargo.toml",
      "build.gradle.kts",
      "pom.xml",
      "App.csproj",
      "composer.json",
      "Gemfile",
      "Package.swift",
    ]);
  });
});

describe("parsers", () => {
  it("parses package.json", () => {
    const artifact = parsePackageJson(
      "package.json",
      JSON.stringify({
        name: "web",
        description: "App",
        dependencies: { react: "^19" },
      }),
    );
    expect(artifact?.language).toBe("javascript");
    expect(artifact?.summary).toContain("name: web");
    expect(summarizePackageJson("package.json", { name: "web" })).toContain("name: web");
  });

  it("parses go.mod", () => {
    const artifact = parseGoMod(
      "go.mod",
      "module github.com/acme/api\n\ngo 1.22\n\nrequire github.com/gin-gonic/gin v1.9.0\n",
    );
    expect(artifact?.parsed).toMatchObject({ module: "github.com/acme/api", goVersion: "1.22" });
  });

  it("parses pyproject.toml", () => {
    const artifact = parsePythonManifest(
      "pyproject.toml",
      '[project]\nname = "tool"\ndescription = "CLI"\n',
    );
    expect(artifact?.kind).toBe("pyproject.toml");
    expect(artifact?.summary).toContain("name: tool");
  });

  it("parses Cargo.toml", () => {
    const artifact = parseCargoToml(
      "Cargo.toml",
      '[package]\nname = "cli"\nedition = "2021"\n\n[dependencies]\nserde = "1"\n',
    );
    expect(artifact?.language).toBe("rust");
    expect(artifact?.summary).toContain("dependencies: serde");
  });

  it("parses gradle", () => {
    const artifact = parseGradle(
      "build.gradle.kts",
      'plugins { id("org.jetbrains.kotlin.jvm") }\ndependencies { implementation("org.jetbrains.kotlin:kotlin-stdlib") }\n',
    );
    expect(artifact?.language).toBe("kotlin");
  });

  it("parses pom.xml", () => {
    const artifact = parseMavenPom(
      "pom.xml",
      "<project><groupId>com.acme</groupId><artifactId>api</artifactId><dependencies><dependency><artifactId>guava</artifactId></dependency></dependencies></project>",
    );
    expect(artifact?.summary).toContain("com.acme:api");
  });

  it("parses csproj", () => {
    const artifact = parseCsproj(
      "App.csproj",
      '<Project><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup><ItemGroup><PackageReference Include="Newtonsoft.Json" /></ItemGroup></Project>',
    );
    expect(artifact?.language).toBe("csharp");
    expect(artifact?.summary).toContain("Newtonsoft.Json");
  });

  it("parses composer.json", () => {
    const artifact = parseComposerJson(
      "composer.json",
      JSON.stringify({ name: "acme/api", require: { php: "^8.2" } }),
    );
    expect(artifact?.language).toBe("php");
  });

  it("parses Gemfile", () => {
    const artifact = parseGemfile(
      "Gemfile",
      'source "https://rubygems.org"\nruby "3.3.0"\ngem "rails"\n',
    );
    expect(artifact?.summary).toContain("gems: rails");
  });

  it("parses Package.swift", () => {
    const artifact = parseSwiftPackage(
      "Package.swift",
      'let package = Package(name: "Kit", products: [.library(name: "Kit")], dependencies: [.package(url: "https://example.com/A.git")])',
    );
    expect(artifact?.language).toBe("swift");
    expect(artifact?.summary).toContain("name: Kit");
  });
});
