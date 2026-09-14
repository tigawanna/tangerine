import { gemmaPrefsFilePath } from "@/data-access-layer/embeddings/gemma-prefs";
import { ortInstallRoot } from "@/data-access-layer/embeddings/ort-runtime";

/**
 * Opens a local path in the OS file manager (folder, or parent if the file is missing).
 * Restricted to the EmbeddingGemma cache / prefs / ORT directory tree.
 */
export async function openGemmaPathAt(path: string): Promise<{ opened: string }> {
  const { existsSync, mkdirSync, realpathSync, statSync } = await import("node:fs");
  const { dirname, resolve, sep } = await import("node:path");
  const { homedir, platform } = await import("node:os");
  const { spawn } = await import("node:child_process");
  const { getGemmaModelCacheDir, getTransformersCacheRoot } =
    await import("@repo/gemma-embedding/node");

  const allowedRoots = [
    getTransformersCacheRoot(),
    getGemmaModelCacheDir(),
    dirname(gemmaPrefsFilePath()),
    resolve(homedir(), ".config", "tangerine-desktop"),
    dirname(ortInstallRoot()),
  ].map((root) => resolve(root));

  const requested = resolve(path);

  function isUnderAllowed(candidate: string): boolean {
    const normalized = candidate.endsWith(sep) ? candidate : `${candidate}${sep}`;
    return allowedRoots.some((root) => {
      const rootNorm = root.endsWith(sep) ? root : `${root}${sep}`;
      return normalized === rootNorm || normalized.startsWith(rootNorm) || candidate === root;
    });
  }

  if (!isUnderAllowed(requested)) {
    throw new Error("Path is outside the EmbeddingGemma cache");
  }

  let target = requested;
  if (!existsSync(target)) {
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
  }

  let openTarget: string;
  try {
    openTarget = statSync(target).isDirectory() ? target : dirname(target);
  } catch {
    openTarget = dirname(target);
  }

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
    resolvePromise();
  });

  return { opened: openTarget };
}
