import type { GemmaModelSettingsResult } from "@/data-access-layer/embeddings/embed.functions";

export type VariantSort = "size" | "exists";

export type VariantRow = GemmaModelSettingsResult["cache"]["variants"][number];

/** Ready first, then partial downloads, then missing; tie-break by size ascending. */
function compareByExists(a: VariantRow, b: VariantRow): number {
  const rank = (v: VariantRow) => (v.ready ? 0 : v.onDiskBytes > 0 ? 1 : 2);
  const byRank = rank(a) - rank(b);
  if (byRank !== 0) return byRank;
  return a.approxBytes - b.approxBytes;
}

function compareBySize(a: VariantRow, b: VariantRow): number {
  return a.approxBytes - b.approxBytes;
}

export function sortVariants(variants: VariantRow[], sort: VariantSort): VariantRow[] {
  const copy = [...variants];
  copy.sort(sort === "exists" ? compareByExists : compareBySize);
  return copy;
}

/** Parent directory of the first on-disk path for a variant. */
export function variantFolder(variant: VariantRow): string {
  const first = variant.paths[0];
  if (!first) return "";
  return first.replace(/[/\\][^/\\]+$/, "") || first;
}
