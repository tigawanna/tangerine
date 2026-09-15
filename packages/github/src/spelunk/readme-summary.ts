/** Default number of README lines kept for repo list / card summaries. */
export const README_SUMMARY_LINES = 20;

/**
 * Clips a README to its first N lines (default {@link README_SUMMARY_LINES}).
 * Returns `null` when the input is empty or whitespace-only.
 */
export function clipReadmeSummary(
  readme: string | null | undefined,
  maxLines: number = README_SUMMARY_LINES,
): string | null {
  if (!readme) return null;
  const lines = readme.split(/\r?\n/, maxLines);
  const clipped = lines.join("\n").trim();
  return clipped.length > 0 ? clipped : null;
}
