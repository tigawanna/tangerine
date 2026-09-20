import { createFsDrain } from "evlog/fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { definePlugin } from "nitro";

/** Repo-root `.evlog/logs` (this file: `apps/<app>/src/lib/evlog`). */
const EVLOG_FS_DIR = join(fileURLToPath(new URL("../../../../../.evlog/logs", import.meta.url)));

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook(
    "evlog:drain",
    createFsDrain({
      dir: EVLOG_FS_DIR,
      maxFiles: 14,
    }),
  );
});
