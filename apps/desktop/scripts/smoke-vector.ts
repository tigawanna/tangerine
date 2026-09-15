/**
 * Smoke-test Turso vector insert + `vector_top_k`.
 * Run: `pnpm exec tsx --env-file=.env ./scripts/smoke-vector.ts`
 */
import { eq, sql } from "drizzle-orm";
import { db, enrichedRepos } from "../src/db/index.ts";

const vec = Array.from({ length: 768 }, (_, i) => (i % 10) / 10);

await db.insert(enrichedRepos).values({
  id: "smoke-1",
  owner: "tigawanna",
  name: "tangerine",
  type: "starred",
  chunkKey: "readme",
  modelId: "embeddinggemma-300m",
  sourceGeneration: 1,
  text: "smoke test chunk",
  embedding: vec,
});

const rows = await db.all(sql`
  SELECT id FROM vector_top_k(
    'enriched_repos_vector_idx',
    vector32(${JSON.stringify(vec)}),
    1
  )
`);

console.info("vector_top_k ok:", rows);

await db.delete(enrichedRepos).where(eq(enrichedRepos.id, "smoke-1"));
console.info("cleaned up");
