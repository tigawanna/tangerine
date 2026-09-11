import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { arch, homedir, platform } from "node:os";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";

/** Pinned to desktop package.json dependency. */
export const ORT_NPM_VERSION = "1.27.0";

/** Approx installed size for current OS binary set (UI copy). */
export const ORT_APPROX_BYTES = 40_000_000;

export type OrtRuntimePhase = "missing" | "downloading" | "ready" | "error" | "cancelled";

export type OrtRuntimeSnapshot = {
  phase: OrtRuntimePhase;
  progress: number;
  approxBytes: number;
  onDiskBytes: number;
  /** Install / discovery root shown in settings. */
  path: string;
  source: "bundled" | "downloaded" | "missing";
  error?: string;
  file?: string;
};

type OrtController = {
  abort: AbortController;
  promise: Promise<void>;
};

let snapshot: OrtRuntimeSnapshot = {
  phase: "missing",
  progress: 0,
  approxBytes: ORT_APPROX_BYTES,
  onDiskBytes: 0,
  path: ortInstallRoot(),
  source: "missing",
};

let active: OrtController | null = null;

function configRoot(): string {
  return join(homedir(), ".config", "tangerine-desktop");
}

/** `…/native/node_modules/onnxruntime-node` — NODE_PATH parent is `…/native/node_modules`. */
export function ortInstallRoot(): string {
  return join(configRoot(), "native", "node_modules", "onnxruntime-node");
}

function ortNodeModulesRoot(): string {
  return join(configRoot(), "native", "node_modules");
}

function platformBindingPath(root: string): string {
  return join(root, "bin", "napi-v6", platform(), arch(), "onnxruntime_binding.node");
}

function dirFileBytes(path: string): number {
  try {
    return statSync(path).size;
  } catch {
    return 0;
  }
}

function bindingBytes(root: string): number {
  const binding = platformBindingPath(root);
  const dir = dirname(binding);
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const name of readdirSync(dir)) {
    total += dirFileBytes(join(dir, name));
  }
  return total;
}

async function canImportOrt(): Promise<boolean> {
  try {
    await import("onnxruntime-node");
    return true;
  } catch {
    return false;
  }
}

function downloadedOrtReady(): boolean {
  return existsSync(platformBindingPath(ortInstallRoot()));
}

/**
 * Prepends the downloaded ORT `node_modules` root to `NODE_PATH` when present.
 * Best-effort for Node/Nitro resolution of `onnxruntime-node`.
 */
export function ensureOrtModulePath(): void {
  if (!downloadedOrtReady()) return;
  const nm = ortNodeModulesRoot();
  const parts = (process.env.NODE_PATH ?? "").split(delimiter).filter(Boolean);
  if (parts.includes(nm)) return;
  process.env.NODE_PATH = parts.length > 0 ? `${nm}${delimiter}${parts.join(delimiter)}` : nm;
}

/**
 * Refresh ORT snapshot from disk / import without starting a download.
 */
export async function refreshOrtRuntimeSnapshot(): Promise<OrtRuntimeSnapshot> {
  if (active && snapshot.phase === "downloading") {
    return { ...snapshot };
  }

  const installPath = ortInstallRoot();
  if (await canImportOrt()) {
    snapshot = {
      phase: "ready",
      progress: 100,
      approxBytes: ORT_APPROX_BYTES,
      onDiskBytes: downloadedOrtReady() ? bindingBytes(installPath) : ORT_APPROX_BYTES,
      path: downloadedOrtReady() ? installPath : "bundled (node_modules)",
      source: downloadedOrtReady() ? "downloaded" : "bundled",
    };
    return { ...snapshot };
  }

  if (downloadedOrtReady()) {
    ensureOrtModulePath();
    snapshot = {
      phase: "ready",
      progress: 100,
      approxBytes: ORT_APPROX_BYTES,
      onDiskBytes: bindingBytes(installPath),
      path: installPath,
      source: "downloaded",
    };
    return { ...snapshot };
  }

  snapshot = {
    phase: "missing",
    progress: 0,
    approxBytes: ORT_APPROX_BYTES,
    onDiskBytes: 0,
    path: installPath,
    source: "missing",
  };
  return { ...snapshot };
}

export function getOrtRuntimeSnapshot(): OrtRuntimeSnapshot {
  return { ...snapshot };
}

function runTarExtract(archive: string, dest: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("tar", ["-xzf", archive, "-C", dest, "--strip-components=1"], {
      stdio: "ignore",
    });
    const onAbort = () => {
      child.kill("SIGTERM");
      reject(new Error("ONNX Runtime download cancelled"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    child.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
    child.on("exit", (code) => {
      signal.removeEventListener("abort", onAbort);
      if (code === 0) resolve();
      else reject(new Error(`tar extract failed (exit ${code ?? "?"})`));
    });
  });
}

/**
 * Download platform ORT package into the desktop config tree (cancellable).
 * No-ops when already resolvable.
 */
export async function beginOrtRuntimeDownload(): Promise<OrtRuntimeSnapshot> {
  const current = await refreshOrtRuntimeSnapshot();
  if (current.phase === "ready") return current;
  if (active) return getOrtRuntimeSnapshot();

  const abort = new AbortController();
  const installRoot = ortInstallRoot();
  mkdirSync(dirname(installRoot), { recursive: true });

  const promise = (async () => {
    snapshot = {
      phase: "downloading",
      progress: 0,
      approxBytes: ORT_APPROX_BYTES,
      onDiskBytes: 0,
      path: installRoot,
      source: "missing",
      file: `onnxruntime-node@${ORT_NPM_VERSION}`,
    };

    const tarballUrl = `https://registry.npmjs.org/onnxruntime-node/-/onnxruntime-node-${ORT_NPM_VERSION}.tgz`;
    const response = await fetch(tarballUrl, { signal: abort.signal });
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download ONNX Runtime (${response.status})`);
    }

    const total = Number(response.headers.get("content-length") ?? 0);
    const tmpDir = join(configRoot(), "native", ".tmp");
    mkdirSync(tmpDir, { recursive: true });
    const archivePath = join(tmpDir, `onnxruntime-node-${ORT_NPM_VERSION}.tgz`);

    let loaded = 0;
    const nodeStream = Readable.fromWeb(
      response.body as import("node:stream/web").ReadableStream,
    );
    nodeStream.on("data", (chunk: Buffer | string) => {
      loaded += typeof chunk === "string" ? Buffer.byteLength(chunk) : chunk.byteLength;
      const pct =
        total > 0
          ? Math.min(90, Math.round((loaded / total) * 90))
          : Math.min(90, snapshot.progress + 1);
      snapshot = {
        ...snapshot,
        progress: pct,
        onDiskBytes: loaded,
        file: "onnxruntime-node.tgz",
      };
    });

    await pipeline(nodeStream, createWriteStream(archivePath));
    if (abort.signal.aborted) throw new Error("ONNX Runtime download cancelled");

    snapshot = { ...snapshot, progress: 92, file: "extracting…" };
    rmSync(installRoot, { recursive: true, force: true });
    mkdirSync(installRoot, { recursive: true });
    await runTarExtract(archivePath, installRoot, abort.signal);

    const binRoot = join(installRoot, "bin", "napi-v6");
    if (existsSync(binRoot)) {
      for (const osName of readdirSync(binRoot)) {
        if (osName !== platform()) {
          rmSync(join(binRoot, osName), { recursive: true, force: true });
        }
      }
    }

    rmSync(archivePath, { force: true });
    ensureOrtModulePath();

    const commonRoot = join(ortNodeModulesRoot(), "onnxruntime-common");
    if (!existsSync(join(commonRoot, "package.json"))) {
      snapshot = { ...snapshot, progress: 96, file: "onnxruntime-common" };
      const commonUrl = `https://registry.npmjs.org/onnxruntime-common/-/onnxruntime-common-${ORT_NPM_VERSION}.tgz`;
      const commonRes = await fetch(commonUrl, { signal: abort.signal });
      if (!commonRes.ok || !commonRes.body) {
        throw new Error(`Failed to download onnxruntime-common (${commonRes.status})`);
      }
      const commonArchive = join(tmpDir, `onnxruntime-common-${ORT_NPM_VERSION}.tgz`);
      await pipeline(
        Readable.fromWeb(commonRes.body as import("node:stream/web").ReadableStream),
        createWriteStream(commonArchive),
      );
      mkdirSync(commonRoot, { recursive: true });
      await runTarExtract(commonArchive, commonRoot, abort.signal);
      rmSync(commonArchive, { force: true });
    }

    snapshot = {
      phase: "ready",
      progress: 100,
      approxBytes: ORT_APPROX_BYTES,
      onDiskBytes: bindingBytes(installRoot),
      path: installRoot,
      source: "downloaded",
    };
  })()
    .catch((caught: unknown) => {
      if (abort.signal.aborted || (caught instanceof Error && /cancel/i.test(caught.message))) {
        snapshot = {
          ...snapshot,
          phase: "cancelled",
          error: "Download cancelled",
        };
        return;
      }
      snapshot = {
        ...snapshot,
        phase: "error",
        error: caught instanceof Error ? caught.message : "ONNX Runtime download failed",
      };
    })
    .finally(() => {
      active = null;
    });

  active = { abort, promise };
  return getOrtRuntimeSnapshot();
}

/** Cancel an in-flight ORT download (no-op if idle). */
export function cancelOrtRuntimeDownload(): OrtRuntimeSnapshot {
  if (active) {
    active.abort.abort();
    active = null;
  }
  if (snapshot.phase === "downloading") {
    snapshot = { ...snapshot, phase: "cancelled", error: "Download cancelled" };
  }
  return getOrtRuntimeSnapshot();
}

/** Await the active ORT download promise if any. */
export async function awaitOrtRuntimeDownload(): Promise<OrtRuntimeSnapshot> {
  if (active) await active.promise;
  return getOrtRuntimeSnapshot();
}
