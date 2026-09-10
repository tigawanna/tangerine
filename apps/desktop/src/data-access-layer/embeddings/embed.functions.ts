import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { gemmaPrefsFilePath, readGemmaPrefs, writeGemmaPrefs } from "./gemma-prefs";

/** Max chars accepted by `embedText` (payload / paste comfort). */
export const EMBED_TEXT_MAX_CHARS = 20_000;

/** Soft UI max for word counter (EmbeddingGemma context ≈ 2048 tokens). */
export const EMBED_TEXT_MAX_WORDS = 2_048;

const embedTextInput = z.object({
  text: z.string().trim().min(1).max(EMBED_TEXT_MAX_CHARS),
  mode: z.enum(["document", "query"]),
});

const selectModelInput = z.object({
  dtype: z.enum(["q4", "q8", "fp16", "fp32"]),
});

const openPathInput = z.object({
  path: z.string().trim().min(1).max(4096),
});

export type EmbedTextInput = z.infer<typeof embedTextInput>;

export type EmbedTextResult = {
  modelId: string;
  dimensions: number;
  mode: "document" | "query";
  embedding: number[];
  /** Wall times so we can separate model download/load from inference. */
  timing: {
    loadMs: number;
    embedMs: number;
    totalMs: number;
  };
};

export type GemmaLoadStatusResult = {
  phase: "idle" | "loading" | "ready" | "error";
  progress: number;
  file?: string;
  error?: string;
  dtype: "q4" | "q8" | "fp16" | "fp32";
};

export type GemmaModelSettingsResult = {
  activeDtype: "q4" | "q8" | "fp16" | "fp32";
  prefsPath: string;
  load: GemmaLoadStatusResult;
  cache: {
    cacheRoot: string;
    modelDir: string;
    hfModelId: string;
    variants: Array<{
      id: "q4" | "q8" | "fp16" | "fp32";
      label: string;
      description: string;
      approxBytes: number;
      ready: boolean;
      onDiskBytes: number;
      paths: string[];
      missing: string[];
    }>;
  };
};

/** Poll while an embed / model switch is in flight. */
export const getGemmaLoadStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GemmaLoadStatusResult> => {
    const { getGemmaLoadSnapshot } = await import("@repo/gemma-embedding/server");
    return getGemmaLoadSnapshot();
  },
);

/**
 * Settings page: active dtype, cache inventory, live load progress.
 * Cache paths are resolved via filesystem (not package.json exports).
 */
export const getGemmaModelSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<GemmaModelSettingsResult> => {
    const prefs = readGemmaPrefs();
    const { getGemmaModelSettingsSnapshot, setActiveGemmaDtype } = await import(
      "@repo/gemma-embedding/server"
    );
    setActiveGemmaDtype(prefs.dtype);
    const snapshot = getGemmaModelSettingsSnapshot();
    return {
      ...snapshot,
      prefsPath: gemmaPrefsFilePath(),
    };
  },
);

/**
 * Persist dtype preference and start download/load of that variant.
 * Returns immediately — poll `getGemmaLoadStatus` for progress.
 */
export const selectGemmaModel = createServerFn({ method: "POST" })
  .inputValidator(selectModelInput)
  .handler(async ({ data }): Promise<GemmaLoadStatusResult> => {
    writeGemmaPrefs({ dtype: data.dtype });
    const { beginServerGemmaDtypeSwitch } = await import("@repo/gemma-embedding/server");
    return beginServerGemmaDtypeSwitch(data.dtype);
  });

/**
 * Opens a local path in the OS file manager (folder, or parent if the file is missing).
 * Restricted to the EmbeddingGemma cache / prefs directory tree.
 */
export const openGemmaPath = createServerFn({ method: "POST" })
  .inputValidator(openPathInput)
  .handler(async ({ data }): Promise<{ opened: string }> => {
    const { existsSync, mkdirSync, realpathSync, statSync } = await import("node:fs");
    const { dirname, resolve, sep } = await import("node:path");
    const { homedir, platform } = await import("node:os");
    const { spawn } = await import("node:child_process");
    const { getGemmaModelCacheDir, getTransformersCacheRoot } = await import(
      "@repo/gemma-embedding/server"
    );

    const allowedRoots = [
      getTransformersCacheRoot(),
      getGemmaModelCacheDir(),
      dirname(gemmaPrefsFilePath()),
      resolve(homedir(), ".config", "tangerine-desktop"),
    ].map((root) => resolve(root));

    const requested = resolve(data.path);

    function isUnderAllowed(path: string): boolean {
      const normalized = path.endsWith(sep) ? path : `${path}${sep}`;
      return allowedRoots.some((root) => {
        const rootNorm = root.endsWith(sep) ? root : `${root}${sep}`;
        return normalized === rootNorm || normalized.startsWith(rootNorm) || path === root;
      });
    }

    if (!isUnderAllowed(requested)) {
      throw new Error("Path is outside the EmbeddingGemma cache");
    }

    let target = requested;
    if (!existsSync(target)) {
      // Create empty model dir so “Open” still works before first download.
      if (target === resolve(getGemmaModelCacheDir()) || target.endsWith(`${sep}onnx`)) {
        mkdirSync(target, { recursive: true });
      } else {
        let parent = dirname(target);
        while (!existsSync(parent) && parent !== dirname(parent)) {
          parent = dirname(parent);
        }
        if (!isUnderAllowed(parent)) {
          throw new Error("Nothing to open yet — download a model first");
        }
        target = parent;
      }
    }

    try {
      const real = realpathSync(target);
      if (!isUnderAllowed(real)) {
        throw new Error("Path is outside the EmbeddingGemma cache");
      }
      target = real;
    } catch (caught) {
      if (caught instanceof Error && caught.message.includes("outside")) throw caught;
      // realpath fails on some missing edges — keep target
    }

    const openTarget = (() => {
      try {
        return statSync(target).isDirectory() ? target : dirname(target);
      } catch {
        return dirname(target);
      }
    })();

    const os = platform();
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child =
        os === "darwin"
          ? spawn("open", [openTarget], { detached: true, stdio: "ignore" })
          : os === "win32"
            ? spawn("explorer", [openTarget], { detached: true, stdio: "ignore" })
            : spawn("xdg-open", [openTarget], { detached: true, stdio: "ignore" });
      child.on("error", (err) => {
        rejectPromise(err);
      });
      child.unref();
      // Don't wait for the file manager to exit.
      resolvePromise();
    });

    return { opened: openTarget };
  });

/**
 * Local EmbeddingGemma via `@repo/gemma-embedding/server`.
 * Uses persisted dtype preference. Does not write embeddings to the DB.
 */
export const embedText = createServerFn({ method: "POST" })
  .inputValidator(embedTextInput)
  .handler(async ({ data }): Promise<EmbedTextResult> => {
    const prefs = readGemmaPrefs();
    const { getEmbeddingModelId, getServerGemmaEmbedding } = await import(
      "@repo/gemma-embedding/server"
    );

    const totalStart = performance.now();
    const loadStart = performance.now();
    const embedding = await getServerGemmaEmbedding({ dtype: prefs.dtype });
    const loadMs = performance.now() - loadStart;

    const embedStart = performance.now();
    const vector =
      data.mode === "query"
        ? await embedding.embed(data.text, "query")
        : await embedding.embed(data.text, "document");
    const embedMs = performance.now() - embedStart;

    return {
      modelId: getEmbeddingModelId(),
      dimensions: vector.length,
      mode: data.mode,
      embedding: Array.from(vector),
      timing: {
        loadMs,
        embedMs,
        totalMs: performance.now() - totalStart,
      },
    };
  });
