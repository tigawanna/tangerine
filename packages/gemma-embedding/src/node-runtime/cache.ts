import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GEMMA_DTYPE_OPTIONS,
  GEMMA_HF_MODEL_ID,
  getGemmaDtypeOption,
  type GemmaDtypeId,
  type GemmaDtypeOption,
} from "../catalog.js";

export type GemmaCachedVariant = {
  id: GemmaDtypeId;
  label: string;
  description: string;
  approxBytes: number;
  /** True when both ONNX graph + external data files exist (not `.tmp`). */
  ready: boolean;
  /**
   * Bytes of final weight files on disk.
   * Incomplete downloads are wiped on error/cancel (HF does not byte-resume).
   */
  onDiskBytes: number;
  /** Absolute paths for the expected weight files. */
  paths: string[];
  /** Missing or incomplete file basenames. */
  missing: string[];
};

export type GemmaCacheInventory = {
  /** Absolute transformers.js cache root. */
  cacheRoot: string;
  /** Absolute model directory under the cache. */
  modelDir: string;
  hfModelId: string;
  variants: GemmaCachedVariant[];
};

/**
 * Walks up from `start` looking for a pnpm `@huggingface/transformers` install `.cache`.
 * Avoids `require.resolve(.../package.json)` — that subpath is blocked by package exports.
 */
function findPnpmTransformersCache(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 14; i++) {
    const pnpm = join(dir, "node_modules", ".pnpm");
    if (existsSync(pnpm)) {
      let names: string[] = [];
      try {
        names = readdirSync(pnpm);
      } catch {
        names = [];
      }
      for (const name of names) {
        if (!name.startsWith("@huggingface+transformers@")) continue;
        const pkgRoot = join(pnpm, name, "node_modules", "@huggingface", "transformers");
        if (!existsSync(pkgRoot)) continue;
        return join(pkgRoot, ".cache");
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Default when no transformers install is found (new downloads can land here). */
function defaultDesktopCacheRoot(): string {
  return join(homedir(), ".config", "tangerine-desktop", "hf-cache");
}

/**
 * Resolves transformers.js `.cache` directory.
 * Prefer `TRANSFORMERS_CACHE`, then the pnpm package cache, then a desktop-local fallback.
 */
export function getTransformersCacheRoot(): string {
  const fromEnv = process.env.TRANSFORMERS_CACHE?.trim();
  if (fromEnv) return fromEnv;

  const fromCwd = findPnpmTransformersCache(process.cwd());
  if (fromCwd) return fromCwd;

  try {
    const fromModule = findPnpmTransformersCache(fileURLToPath(new URL(".", import.meta.url)));
    if (fromModule) return fromModule;
  } catch {
    // import.meta.url may be unavailable in some bundles
  }

  return defaultDesktopCacheRoot();
}

/** Absolute cache folder for EmbeddingGemma ONNX weights. */
export function getGemmaModelCacheDir(): string {
  return join(getTransformersCacheRoot(), ...GEMMA_HF_MODEL_ID.split("/"));
}

function fileBytes(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function hasInProgressTemp(onnxDir: string, basename: string): boolean {
  if (!existsSync(onnxDir)) return false;
  const prefix = `${basename}.tmp`;
  return readdirSync(onnxDir).some((name) => name.startsWith(prefix));
}

function inspectVariant(modelDir: string, option: GemmaDtypeOption): GemmaCachedVariant {
  const onnxDir = join(modelDir, "onnx");
  const paths = option.files.map((name) => join(onnxDir, name));
  const missing: string[] = [];
  let onDiskBytes = 0;

  for (const [index, path] of paths.entries()) {
    const name = option.files[index]!;
    const size = fileBytes(path);
    onDiskBytes += size;
    if (size <= 0 || hasInProgressTemp(onnxDir, name)) {
      missing.push(name);
    }
  }

  return {
    id: option.id,
    label: option.label,
    description: option.description,
    approxBytes: option.approxBytes,
    ready: missing.length === 0,
    onDiskBytes,
    paths,
    missing,
  };
}

/** Lists which EmbeddingGemma dtypes are fully cached on disk. */
export function inspectGemmaCache(): GemmaCacheInventory {
  const cacheRoot = getTransformersCacheRoot();
  const modelDir = getGemmaModelCacheDir();
  return {
    cacheRoot,
    modelDir,
    hfModelId: GEMMA_HF_MODEL_ID,
    variants: GEMMA_DTYPE_OPTIONS.map((option) => inspectVariant(modelDir, option)),
  };
}

/**
 * Deletes unfinished weight files for a dtype.
 *
 * Transformers.js writes `file.tmp.<pid>.<rand>` then renames; it does not
 * byte-resume, so partial/incomplete variants are useless. No-op when ready.
 */
export function clearIncompleteGemmaVariant(dtype: GemmaDtypeId): void {
  const option = getGemmaDtypeOption(dtype);
  const modelDir = getGemmaModelCacheDir();
  const variant = inspectVariant(modelDir, option);
  if (variant.ready) return;

  const onnxDir = join(modelDir, "onnx");
  if (!existsSync(onnxDir)) return;

  let names: string[] = [];
  try {
    names = readdirSync(onnxDir);
  } catch {
    return;
  }

  for (const basename of option.files) {
    const finalPath = join(onnxDir, basename);
    try {
      rmSync(finalPath, { force: true });
    } catch(e) {
      console.error("== Error deleting incomplete gemma variant == ", e);
    }

    const prefix = `${basename}.tmp`;
    for (const name of names) {
      if (!name.startsWith(prefix)) continue;
      try {
        rmSync(join(onnxDir, name), { force: true });
      } catch(e) {
        console.error("== Error deleting incomplete gemma variant == ", e);
      }
    }
  }
}
