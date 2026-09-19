/**
 * Smoke: liveQuery re-emits when a matching row is inserted.
 * Run: `pnpm exec tsx --env-file=.env ./scripts/smoke-live.ts`
 */
import { eq } from "drizzle-orm";
import { client, db, liveQuery, projectEnrichmentOutputs } from "../src/db/index.ts";

const SMOKE_ID = "smoke-live-1";

await db.delete(projectEnrichmentOutputs).where(eq(projectEnrichmentOutputs.id, SMOKE_ID));

const statement = db
  .select({
    id: projectEnrichmentOutputs.id,
    owner: projectEnrichmentOutputs.owner,
  })
  .from(projectEnrichmentOutputs)
  .where(eq(projectEnrichmentOutputs.type, "starred"));

const sawInsert = Promise.withResolvers<{ id: string; owner: string }[]>();

const sub = await liveQuery(statement, (res) => {
  if (res.rows.some((row) => row.id === SMOKE_ID)) {
    sawInsert.resolve(res.rows);
  }
});

console.info("subscribed — initial rows:", sub.initialResults.rows.length);

await db.insert(projectEnrichmentOutputs).values({
  id: SMOKE_ID,
  owner: "tigawanna",
  name: "tangerine-live",
  type: "starred",
  sourceGeneration: 1,
  payload: {},
});

const timeout = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("liveQuery did not emit within 3s after insert")), 3_000);
});

const rows = await Promise.race([sawInsert.promise, timeout]);
const hit = rows.find((row) => row.id === SMOKE_ID);
if (!hit) throw new Error("live emit missing smoke row");

console.info("liveQuery emit on insert ok:", hit);

await sub.unsubscribe();
await db.delete(projectEnrichmentOutputs).where(eq(projectEnrichmentOutputs.id, SMOKE_ID));
await client.close();
console.info("cleaned up");
