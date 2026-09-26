import { EVLOG_FS_DIR } from "@/lib/evlog/evlog-logs.ts";
import { desktopConfigDir } from "@/pglite/path.ts";

/**
 * Opens a local path in the OS file manager (folder, or parent if the target is a file).
 * Restricted to the desktop config dir and the shared `.evlog/logs` tree.
 */
export async function openSystemPathAt(path: string): Promise<{ opened: string }> {
  const { existsSync, mkdirSync, realpathSync, statSync } = await import("node:fs");
  const { dirname, resolve, sep } = await import("node:path");
  const { platform } = await import("node:os");
  const { spawn } = await import("node:child_process");

  const allowedRoots = [desktopConfigDir(), EVLOG_FS_DIR, dirname(EVLOG_FS_DIR)].map((root) =>
    resolve(root),
  );

  const requested = resolve(path);

  function isUnderAllowed(candidate: string): boolean {
    return allowedRoots.some((root) => {
      const rootNorm = root.endsWith(sep) ? root : `${root}${sep}`;
      const normalized = candidate.endsWith(sep) ? candidate : `${candidate}${sep}`;
      return normalized === rootNorm || normalized.startsWith(rootNorm) || candidate === root;
    });
  }

  if (!isUnderAllowed(requested)) {
    throw new Error("Path is outside allowed desktop / evlog directories");
  }

  let target = requested;
  if (!existsSync(target)) {
    if (target === resolve(EVLOG_FS_DIR) || target === resolve(desktopConfigDir())) {
      mkdirSync(target, { recursive: true });
    } else {
      let parent = dirname(target);
      while (!existsSync(parent) && parent !== dirname(parent)) {
        parent = dirname(parent);
      }
      if (!isUnderAllowed(parent)) {
        throw new Error("Nothing to open yet");
      }
      target = parent;
    }
  }

  try {
    const real = realpathSync(target);
    if (!isUnderAllowed(real)) {
      throw new Error("Path is outside allowed desktop / evlog directories");
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
