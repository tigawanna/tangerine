import type { GemmaModelSettingsResult } from "@/server/elysia/embedding-types";

export type VariantRow = GemmaModelSettingsResult["cache"]["variants"][number];

/** Smallest → largest (lowest → highest quality). */
export function sortVariantsBySize(variants: VariantRow[]): VariantRow[] {
  return [...variants].sort((a, b) => a.approxBytes - b.approxBytes);
}

/** Parent directory of the first on-disk path for a variant. */
export function variantFolder(variant: VariantRow): string {
  const first = variant.paths[0];
  if (!first) return "";
  return first.replace(/[/\\][^/\\]+$/, "") || first;
}
