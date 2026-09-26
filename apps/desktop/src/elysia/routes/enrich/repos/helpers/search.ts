import { EMBED_TEXT_MAX_CHARS } from "@/lib/embedding-gemmma/embed-limits";
import { readGemmaPrefs } from "@/lib/embedding-gemmma/gemma-prefs";
import { ensureOrtReady } from "@/lib/embedding-gemmma/ort-runtime";
import { db } from "@/pglite/client.ts";
import { projectEnrichmentOutputs } from "@/pglite/index.ts";
import { and, cosineDistance, eq, isNotNull, sql } from "drizzle-orm";

/** Max nearest neighbors returned for a semantic user-repos search. */
export const USER_REPOS_SEARCH_LIMIT = 50;

export type UserReposSearchHit = {
  id: string;
  owner: string;
  name: string;
  type: "starred" | "repos" | "other" | null;
  description: string | null;
  summary: string | null;
  url: string | null;
  sourceGeneration: number;
  payload: Record<string, unknown>;
  modelId: string | null;
  embeddedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  distance: number;
};

/**
 * Embed `q` with EmbeddingGemma (query mode) and rank `type=repos` rows by cosine distance.
 */
export async function searchUserReposByQuery(q: string): Promise<UserReposSearchHit[]> {
  const text = q.trim().slice(0, EMBED_TEXT_MAX_CHARS);
  if (!text) return [];

  const prefs = readGemmaPrefs();
  await ensureOrtReady();
  const { embedQuery, getServerGemmaEmbedding } = await import("@repo/gemma-embedding/node");
  await getServerGemmaEmbedding({ dtype: prefs.dtype });
  const vector = Array.from(await embedQuery(text));

  const distance = sql<number>`${cosineDistance(projectEnrichmentOutputs.embedding, vector)}`;

  const rows = await db
    .select({
      id: projectEnrichmentOutputs.id,
      owner: projectEnrichmentOutputs.owner,
      name: projectEnrichmentOutputs.name,
      type: projectEnrichmentOutputs.type,
      description: projectEnrichmentOutputs.description,
      summary: projectEnrichmentOutputs.summary,
      url: projectEnrichmentOutputs.url,
      sourceGeneration: projectEnrichmentOutputs.sourceGeneration,
      payload: projectEnrichmentOutputs.payload,
      modelId: projectEnrichmentOutputs.modelId,
      embeddedAt: projectEnrichmentOutputs.embeddedAt,
      createdAt: projectEnrichmentOutputs.createdAt,
      updatedAt: projectEnrichmentOutputs.updatedAt,
      distance,
    })
    .from(projectEnrichmentOutputs)
    .where(
      and(
        eq(projectEnrichmentOutputs.type, "repos"),
        isNotNull(projectEnrichmentOutputs.embedding),
      ),
    )
    .orderBy(distance)
    .limit(USER_REPOS_SEARCH_LIMIT);

  return rows;
}
