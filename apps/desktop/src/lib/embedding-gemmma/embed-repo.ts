import { EMBED_TEXT_MAX_CHARS } from "./embed-limits.ts";
import { readGemmaPrefs } from "./gemma-prefs.ts";
import { ensureOrtReady } from "./ort-runtime.ts";
import { getGithubToken } from "@/lib/github-token.server.ts";
import { clipReadmeSummary, createGitHubClient } from "@repo/github";

export interface EmbedRepoShape {
  id: string;
  owner: string;
  name: string;
  description: string | null;
  languages: string[];
  tags: string[];
}

export type EmbedRepoResult = {
  owner: string;
  name: string;
  description: string | null;
  summary: string | null;
  modelId: string;
  /** Document text that was embedded. */
  text: string;
  embedding: number[];
};

/**
 * Builds the EmbeddingGemma document from repo metadata + optional README clip.
 */
export function buildRepoEmbedDocument(
  repo: EmbedRepoShape,
  readmeSummary: string | null,
): string {
  const parts = [
    `Repository: ${repo.name}`,
    `Full name: ${repo.owner}/${repo.name}`,
    repo.description ? `Description: ${repo.description}` : null,
    repo.languages.length > 0 ? `Languages: ${repo.languages.join(", ")}` : null,
    repo.tags.length > 0 ? `Tags: ${repo.tags.join(", ")}` : null,
    readmeSummary ? `README:\n${readmeSummary}` : null,
  ];
  const text = parts.filter((part): part is string => Boolean(part)).join("\n");
  if (text.length <= EMBED_TEXT_MAX_CHARS) return text;
  return text.slice(0, EMBED_TEXT_MAX_CHARS);
}

/**
 * Fetches the repo README, builds a short document from metadata + README,
 * and embeds it with EmbeddingGemma (document mode).
 */
export async function embedRepo(repo: EmbedRepoShape): Promise<EmbedRepoResult> {
  const token = await getGithubToken();
  const client = createGitHubClient(token);
  const readme = await client.getRepoReadme(repo.owner, repo.name);
  const summary = clipReadmeSummary(readme?.content);
  const text = buildRepoEmbedDocument(repo, summary);

  if (!text.trim()) {
    throw new Error(`Nothing to embed for ${repo.owner}/${repo.name}`);
  }

  const prefs = readGemmaPrefs();
  await ensureOrtReady();
  const { embedDocument, getEmbeddingModelId, getServerGemmaEmbedding } =
    await import("@repo/gemma-embedding/node");

  await getServerGemmaEmbedding({ dtype: prefs.dtype });
  const vector = await embedDocument(text);

  return {
    owner: repo.owner,
    name: repo.name,
    description: repo.description,
    summary,
    modelId: getEmbeddingModelId(),
    text,
    embedding: Array.from(vector),
  };
}
