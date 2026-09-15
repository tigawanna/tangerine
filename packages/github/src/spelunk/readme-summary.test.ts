import { describe, expect, it } from "vitest";
import { clipReadmeSummary, README_SUMMARY_LINES } from "./readme-summary";

describe("clipReadmeSummary", () => {
  it("returns null for empty input", () => {
    expect(clipReadmeSummary(null)).toBeNull();
    expect(clipReadmeSummary("")).toBeNull();
    expect(clipReadmeSummary("   \n  ")).toBeNull();
  });

  it("keeps short READMEs intact", () => {
    expect(clipReadmeSummary("# Hello\n\nWorld")).toBe("# Hello\n\nWorld");
  });

  it(`clips to the first ${README_SUMMARY_LINES} lines`, () => {
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`);
    const clipped = clipReadmeSummary(lines.join("\n"));
    expect(clipped?.split("\n")).toHaveLength(README_SUMMARY_LINES);
    expect(clipped?.startsWith("line 1")).toBe(true);
    expect(clipped?.endsWith(`line ${README_SUMMARY_LINES}`)).toBe(true);
  });
});
