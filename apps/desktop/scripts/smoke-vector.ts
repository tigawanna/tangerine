/**
 * Smoke-test PGlite pgvector insert + cosine nearest-neighbor.
 * Run: `pnpm exec tsx --env-file=.env ./scripts/smoke-vector.ts`
 *
 * Applies migrations in-process (same PGlite instance) then inserts / queries.
 */
import { migrate } from "drizzle-orm/pglite/migrator";
import { cosineDistance, eq, sql } from "drizzle-orm";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { client, db, projectEnrichmentOutputs } from "../src/pglite/index.ts";

const migrationsFolder = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../src/pglite/migrations",
);

await migrate(db, { migrationsFolder });

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

const distance = sql<number>`${cosineDistance(projectEnrichmentOutputs.embedding, vec)}`;

const rows = await db
  .select({
    id: projectEnrichmentOutputs.id,
    distance,
  })
  .from(projectEnrichmentOutputs)
  .orderBy(distance)
  .limit(1);

console.info("pgvector cosine nn ok:", rows);

await db.delete(projectEnrichmentOutputs).where(eq(projectEnrichmentOutputs.id, "smoke-1"));
await client.close();
console.info("cleaned up");
