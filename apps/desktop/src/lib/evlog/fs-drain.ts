import { createFsDrain } from "evlog/fs";
import { EVLOG_FS_DIR } from "@/lib/evlog/evlog-logs.ts";
import { readEvlogPrefs } from "@/lib/evlog/evlog-prefs.ts";
import { definePlugin } from "nitro";

export default definePlugin((nitroApp) => {
  const prefs = readEvlogPrefs();
  nitroApp.hooks.hook(
    "evlog:drain",
    createFsDrain({
      dir: EVLOG_FS_DIR,
      maxFiles: prefs.maxFiles,
    }),
  );
});
