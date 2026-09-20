import { Job, Worker } from "@conveyor/core";
import { createGitHubClient, clipReadmeSummary } from "@repo/github";
import { EMBED_TEXT_MAX_CHARS } from "@/data-access-layer/embeddings/embed-limits.ts";
import { readGemmaPrefs } from "@/data-access-layer/embeddings/gemma-prefs.ts";
import { ensureOrtReady } from "@/data-access-layer/embeddings/ort-runtime.ts";
import { db } from "@/db/client.ts";
import { projectEnrichmentOutputs } from "@/db/index.ts";
import { getGithubToken } from "@/lib/github-token.server.ts";
import { workerStore } from "@/lib/worker/store.ts";

import {
  REPO_EMBED_QUEUE,
  type RepoEmbedJob,
} from "@/elysia/routes/enrich/starred/helpers/repo-worker.ts";
import {
  getEmbedActivityStatus,
  patchEmbedActivity,
  type EmbedActivityRepoRow,
} from "@/elysia/routes/enrich/starred/helpers/embed-activity.ts";

/**
 * Fetch README → clip → embed → upsert enrichment row.
 */
export async function processRepo(repo: RepoEmbedJob): Promise<EmbedActivityRepoRow> {
  const client = createGitHubClient(await getGithubToken());
  const readme = await client.getRepoReadme(repo.owner, repo.name);
  const summary = clipReadmeSummary(readme?.content ?? null);

  const text = buildEmbedText(repo, summary);
  const { modelId, embedding } = await embedDocumentText(text);
  const embeddedAt = new Date();

  await db
    .insert(projectEnrichmentOutputs)
    .values({
      id: repo.repoId,
      owner: repo.owner,
      name: repo.name,
      type: "starred",
      description: repo.description,
      summary,
      url: repo.url,
      sourceGeneration: 1,
      payload: { languages: repo.languages },
      modelId,
      embedding,
      embeddedAt,
    })
    .onConflictDoUpdate({
      target: [projectEnrichmentOutputs.owner, projectEnrichmentOutputs.name],
      set: {
        id: repo.repoId,
        type: "starred",
        description: repo.description,
        summary,
        url: repo.url,
        payload: { languages: repo.languages },
        modelId,
        embedding,
        embeddedAt,
      },
    });

  return {
    id: repo.repoId,
    owner: repo.owner,
    name: repo.name,
    type: "starred",
    description: repo.description,
    summary,
    url: repo.url,
    sourceGeneration: 1,
    payload: { languages: repo.languages },
    modelId,
    embeddedAt,
    createdAt: embeddedAt,
  };
}

/** Builds the document string for EmbeddingGemma (description + languages + README clip). */
function buildEmbedText(repo: RepoEmbedJob, summary: string | null): string {
  const parts = [
    `Repository: ${repo.owner}/${repo.name}`,
    repo.description ? `Description: ${repo.description}` : null,
    repo.languages.length > 0 ? `Languages: ${repo.languages.join(", ")}` : null,
    summary ? `README:\n${summary}` : null,
  ];

  const text = parts.filter((part): part is string => Boolean(part)).join("\n");
  if (text.length <= EMBED_TEXT_MAX_CHARS) return text;
  return text.slice(0, EMBED_TEXT_MAX_CHARS);
}

/** Document-mode embed with the active local Gemma dtype. */
async function embedDocumentText(text: string): Promise<{ modelId: string; embedding: number[] }> {
  const prefs = readGemmaPrefs();
  await ensureOrtReady();
  const { getEmbeddingModelId, getServerGemmaEmbedding } = await import("@repo/gemma-embedding/node");

  const embedding = await getServerGemmaEmbedding({ dtype: prefs.dtype });
  const vector = await embedding.embed(text, "document");

  return {
    modelId: getEmbeddingModelId(),
    embedding: Array.from(vector),
  };
}

let embedWorkerStarted = false;

/** Idempotent — start the per-repo embed worker once per process. */
export function ensureRepoEmbedWorker(): void {
  if (embedWorkerStarted) return;
  embedWorkerStarted = true;

  new Worker<RepoEmbedJob>(
    REPO_EMBED_QUEUE,
    async (job: Job<RepoEmbedJob>) => {
      const { owner, name } = job.data;
      const before = getEmbedActivityStatus();

      patchEmbedActivity({
        phase: "embedding",
        embed: { current: { owner, name } },
        message: `Embedding ${owner}/${name}`,
      });

      try {
        const row = await processRepo(job.data);
        patchEmbedActivity(
          {
            embed: {
              current: null,
              completed: before.embed.completed + 1,
              lastError: null,
            },
            message: `Embedded ${owner}/${name}`,
          },
          row,
        );
        return row;
      } catch (caught) {
        const lastError = caught instanceof Error ? caught.message : "Embed failed";
        patchEmbedActivity({
          phase: "error",
          embed: {
            current: null,
            failed: before.embed.failed + 1,
            lastError,
          },
          message: lastError,
        });
        throw caught;
      }
    },
    { store: workerStore, concurrency: 1 },
  );
}
