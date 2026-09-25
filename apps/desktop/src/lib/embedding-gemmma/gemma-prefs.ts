import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import {
  DEFAULT_GEMMA_DTYPE,
  isGemmaDtypeId,
  type GemmaDtypeId,
} from "@repo/gemma-embedding/catalog";

export type DesktopGemmaPrefs = {
  dtype: GemmaDtypeId;
  /**
   * User cancelled or dismissed first-run embedding component downloads.
   * When true, dashboard will not auto-start runtime + Q4 prefetch.
   */
  bootstrapDismissed?: boolean;
};

function prefsPath(): string {
  return join(homedir(), ".config", "tangerine-desktop", "gemma.json");
}

/**
 * Reads persisted EmbeddingGemma prefs (falls back to defaults).
 */
export function readGemmaPrefs(): DesktopGemmaPrefs {
  try {
    const raw = readFileSync(prefsPath(), "utf8");
    const parsed = JSON.parse(raw) as {
      dtype?: string;
      bootstrapDismissed?: boolean;
    };
    const dtype = parsed.dtype && isGemmaDtypeId(parsed.dtype) ? parsed.dtype : DEFAULT_GEMMA_DTYPE;
    return {
      dtype,
      bootstrapDismissed: parsed.bootstrapDismissed === true,
    };
  } catch {
    return { dtype: DEFAULT_GEMMA_DTYPE };
  }
}

/** True when `gemma.json` already exists on disk (not first launch). */
export function gemmaPrefsFileExists(): boolean {
  try {
    readFileSync(prefsPath(), "utf8");
    return true;
  } catch {
    return false;
  }
}

/** Persists EmbeddingGemma prefs under ~/.config/tangerine-desktop. */
export function writeGemmaPrefs(prefs: DesktopGemmaPrefs): void {
  const path = prefsPath();
  mkdirSync(dirname(path), { recursive: true });
  const next: DesktopGemmaPrefs = {
    dtype: prefs.dtype,
    ...(prefs.bootstrapDismissed ? { bootstrapDismissed: true } : {}),
  };
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

export function gemmaPrefsFilePath(): string {
  return prefsPath();
}
