-- Custom: drizzle-kit cannot emit HNSW / vector_cosine_ops.
CREATE INDEX IF NOT EXISTS "project_enrichment_outputs_embedding_hnsw_idx"
  ON "project_enrichment_outputs"
  USING hnsw ("embedding" vector_cosine_ops);
