import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Monorepo-root `.evlog/logs` so api / web / desktop share one NDJSON sink
 * (distinct `service` fields). Relative to this file: `apps/api/src/lib` → repo root.
 */
export const EVLOG_FS_DIR = join(
  fileURLToPath(new URL("../../../..", import.meta.url)),
  ".evlog",
  "logs",
);
