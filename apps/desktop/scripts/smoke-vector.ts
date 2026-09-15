/**
 * Smoke-test Turso vector insert + `vector_top_k`.
 * Run: `pnpm exec tsx --env-file=.env ./scripts/smoke-vector.ts`
 */
import { eq, sql } from "drizzle-orm";
import { db, projectEnrichmentOutputs } from "../src/db/index.ts";

const vec = Array.from({ length: 768 }, (_, i) => (i % 10) / 10);

await db.insert(projectEnrichmentOutputs).values({
  id: "smoke-1",
  owner: "tigawanna",
  name: "tangerine",
  type: "starred",
  sourceGeneration: 1,
  payload: {},
  modelId: "embeddinggemma-300m",
  embedding: vec,
  embeddedAt: new Date(),
});

const rows = await db.all(sql`
  SELECT id FROM vector_top_k(
    'project_enrichment_outputs_vector_idx',
    vector32(${JSON.stringify(vec)}),
    1
  )
`);

console.info("vector_top_k ok:", rows);

await db.delete(projectEnrichmentOutputs).where(eq(projectEnrichmentOutputs.id, "smoke-1"));
console.info("cleaned up");
