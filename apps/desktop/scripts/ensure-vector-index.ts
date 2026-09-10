/**
 * Applies schema + vector ANN index to the embedded Turso/libSQL database.
 * Usage: `pnpm db:push` (drizzle-kit) then `pnpm db:ensure-vector` — or just `pnpm db:setup`.
 */
import { ensureVectorIndex } from "../src/db/ensure-vector-index";

await ensureVectorIndex();
console.info("project_embeddings vector index ready");
