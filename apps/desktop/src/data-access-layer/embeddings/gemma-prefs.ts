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
};

function prefsPath(): string {
  return join(homedir(), ".config", "tangerine-desktop", "gemma.json");
}

/**
 * Reads persisted EmbeddingGemma dtype preference (falls back to default).
 */
export function readGemmaPrefs(): DesktopGemmaPrefs {
  try {
    const raw = readFileSync(prefsPath(), "utf8");
    const parsed = JSON.parse(raw) as { dtype?: string };
    if (parsed.dtype && isGemmaDtypeId(parsed.dtype)) {
      return { dtype: parsed.dtype };
    }
  } catch {
    // missing / invalid → default
  }
  return { dtype: DEFAULT_GEMMA_DTYPE };
}

/** Persists EmbeddingGemma dtype preference under ~/.config/tangerine-desktop. */
export function writeGemmaPrefs(prefs: DesktopGemmaPrefs): void {
  const path = prefsPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(prefs, null, 2)}\n`, "utf8");
}

export function gemmaPrefsFilePath(): string {
  return prefsPath();
}
