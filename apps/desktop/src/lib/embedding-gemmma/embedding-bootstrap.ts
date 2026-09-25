import { gemmaPrefsFileExists, readGemmaPrefs, writeGemmaPrefs } from "./gemma-prefs";
import {
  awaitOrtRuntimeDownload,
  beginOrtRuntimeDownload,
  cancelOrtRuntimeDownload,
  ensureOrtReady,
  getOrtRuntimeSnapshot,
  refreshOrtRuntimeSnapshot,
  type OrtRuntimeSnapshot,
} from "./ort-runtime";

/** Smallest CPU EmbeddingGemma variant — first-run prefetch target. */
export const BOOTSTRAP_MODEL_DTYPE = "q4" as const;

export type BootstrapBundlePhase =
  | "idle"
  | "missing"
  | "downloading"
  | "ready"
  | "error"
  | "cancelled";

export type EmbeddingBootstrapStatus = {
  /** Dashboard should auto-start when true. */
  shouldAutoStart: boolean;
  dismissed: boolean;
  runtime: OrtRuntimeSnapshot;
  model: {
    dtype: typeof BOOTSTRAP_MODEL_DTYPE;
    phase: BootstrapBundlePhase;
    progress: number;
    file?: string;
    error?: string;
    ready: boolean;
    approxBytes: number;
    onDiskBytes: number;
  };
  overall: {
    phase: "idle" | "running" | "ready" | "error" | "cancelled";
    label: string;
    progress: number;
  };
};

let bootstrapRunning = false;
let bootstrapCancelled = false;

function modelPhaseFromLoad(
  load: { phase: string; progress: number; file?: string; error?: string },
  ready: boolean,
  cancelled: boolean,
): Pick<EmbeddingBootstrapStatus["model"], "phase" | "progress" | "file" | "error"> {
  if (ready) return { phase: "ready", progress: 100 };
  if (cancelled)
    return { phase: "cancelled", progress: load.progress, error: "Download cancelled" };
  if (load.phase === "loading") {
    return { phase: "downloading", progress: load.progress, file: load.file };
  }
  if (load.phase === "error") {
    return {
      phase: "error",
      progress: load.progress,
      error: load.error ?? "Model download failed",
    };
  }
  if (load.phase === "ready") return { phase: "ready", progress: 100 };
  return { phase: "missing", progress: 0 };
}

function overallFrom(
  runtime: OrtRuntimeSnapshot,
  model: EmbeddingBootstrapStatus["model"],
  running: boolean,
): EmbeddingBootstrapStatus["overall"] {
  if (runtime.phase === "cancelled" || model.phase === "cancelled") {
    return { phase: "cancelled", label: "Download cancelled", progress: model.progress };
  }
  if (runtime.phase === "error") {
    return {
      phase: "error",
      label: runtime.error ?? "Runtime download failed",
      progress: runtime.progress,
    };
  }
  if (model.phase === "error") {
    return {
      phase: "error",
      label: model.error ?? "Model download failed",
      progress: model.progress,
    };
  }
  if (runtime.phase === "ready" && model.phase === "ready") {
    return { phase: "ready", label: "Embedding components ready", progress: 100 };
  }
  if (running || runtime.phase === "downloading" || model.phase === "downloading") {
    const runtimeWeight = 0.2;
    const modelWeight = 0.8;
    const runtimePct = runtime.phase === "ready" ? 100 : runtime.progress;
    const modelPct = model.phase === "ready" ? 100 : model.progress;
    const progress = Math.round(runtimePct * runtimeWeight + modelPct * modelWeight);
    const label =
      runtime.phase === "downloading"
        ? "Downloading ONNX Runtime…"
        : model.file
          ? `Fetching ${model.file}`
          : "Downloading Q4 embedding model…";
    return { phase: "running", label, progress };
  }
  if (runtime.phase === "missing" || model.phase === "missing") {
    return { phase: "idle", label: "Components not installed", progress: 0 };
  }
  return { phase: "idle", label: "Idle", progress: 0 };
}

/**
 * Combined runtime + Q4 bootstrap status for toasts and settings.
 */
export async function getEmbeddingBootstrapStatus(): Promise<EmbeddingBootstrapStatus> {
  const prefs = readGemmaPrefs();
  const runtime = await refreshOrtRuntimeSnapshot();

  const { inspectGemmaCache, getGemmaLoadSnapshot } = await import("@repo/gemma-embedding/node");
  const cache = inspectGemmaCache();
  const q4 = cache.variants.find((v) => v.id === BOOTSTRAP_MODEL_DTYPE);
  const load = getGemmaLoadSnapshot();
  const modelReady = q4?.ready === true;
  const modelMeta = modelPhaseFromLoad(
    load.dtype === BOOTSTRAP_MODEL_DTYPE || !modelReady ? load : { phase: "idle", progress: 0 },
    modelReady,
    bootstrapCancelled && !modelReady,
  );

  const model: EmbeddingBootstrapStatus["model"] = {
    dtype: BOOTSTRAP_MODEL_DTYPE,
    ...modelMeta,
    ready: modelReady,
    approxBytes: q4?.approxBytes ?? 197_000_000,
    onDiskBytes: q4?.onDiskBytes ?? 0,
  };

  const dismissed = prefs.bootstrapDismissed === true;
  const firstRun = !gemmaPrefsFileExists();
  const needsRuntime = runtime.phase !== "ready";
  const needsSeedModel = !modelReady && (firstRun || prefs.dtype === BOOTSTRAP_MODEL_DTYPE);
  const shouldAutoStart = !dismissed && (needsRuntime || needsSeedModel);

  return {
    shouldAutoStart,
    dismissed,
    runtime,
    model,
    overall: overallFrom(runtime, model, bootstrapRunning),
  };
}

/**
 * Start first-run style download: ORT (if needed) then Q4 model weights.
 * Returns immediately; poll `getEmbeddingBootstrapStatus`.
 */
export function startEmbeddingBootstrap(): Promise<EmbeddingBootstrapStatus> {
  if (bootstrapRunning) return getEmbeddingBootstrapStatus();

  bootstrapCancelled = false;
  bootstrapRunning = true;

  const prefs = readGemmaPrefs();
  if (prefs.bootstrapDismissed) {
    writeGemmaPrefs({ ...prefs, bootstrapDismissed: false });
  }

  // First launch with no prefs → prefer the small Q4 variant.
  if (!gemmaPrefsFileExists()) {
    writeGemmaPrefs({ dtype: BOOTSTRAP_MODEL_DTYPE });
  }

  void (async () => {
    try {
      await ensureOrtReady();
      await beginOrtRuntimeDownload();
      if (bootstrapCancelled) return;
      await awaitOrtRuntimeDownload();
      if (bootstrapCancelled) return;

      const runtime = getOrtRuntimeSnapshot();
      if (runtime.phase !== "ready") return;

      const { inspectGemmaCache, beginServerGemmaDtypeSwitch, setActiveGemmaDtype } =
        await import("@repo/gemma-embedding/node");
      const q4 = inspectGemmaCache().variants.find((v) => v.id === BOOTSTRAP_MODEL_DTYPE);
      if (q4?.ready) return;

      writeGemmaPrefs({ ...readGemmaPrefs(), dtype: BOOTSTRAP_MODEL_DTYPE });
      setActiveGemmaDtype(BOOTSTRAP_MODEL_DTYPE);
      beginServerGemmaDtypeSwitch(BOOTSTRAP_MODEL_DTYPE);
    } finally {
      // Model download continues async via gemma load snapshot; overall.phase stays "running"
      // while load.phase === "loading". Clear the latch once ORT work finished.
      if (bootstrapCancelled || getOrtRuntimeSnapshot().phase !== "downloading") {
        bootstrapRunning = false;
      }
    }
  })();

  return getEmbeddingBootstrapStatus();
}

/**
 * Cancel in-flight bootstrap (ORT fetch + best-effort model unload).
 * Marks prefs so auto-start will not retry until the user opts in again.
 */
export async function cancelEmbeddingBootstrap(): Promise<EmbeddingBootstrapStatus> {
  bootstrapCancelled = true;
  bootstrapRunning = false;
  cancelOrtRuntimeDownload();

  try {
    const { unloadServerGemmaEmbedding } = await import("@repo/gemma-embedding/node");
    await unloadServerGemmaEmbedding();
  } catch {
    // ignore unload errors
  }

  const prefs = readGemmaPrefs();
  writeGemmaPrefs({ ...prefs, bootstrapDismissed: true });

  return getEmbeddingBootstrapStatus();
}

/** Clear dismissed flag and start again (settings “Download” / toast retry). */
export function resumeEmbeddingBootstrap(): Promise<EmbeddingBootstrapStatus> {
  const prefs = readGemmaPrefs();
  writeGemmaPrefs({ ...prefs, bootstrapDismissed: false });
  bootstrapCancelled = false;
  return startEmbeddingBootstrap();
}
