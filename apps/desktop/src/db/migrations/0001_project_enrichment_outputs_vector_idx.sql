-- Custom SQL migration: Turso/libSQL ANN index (drizzle-kit cannot emit this).
CREATE INDEX IF NOT EXISTS `project_enrichment_outputs_vector_idx`
ON `project_enrichment_outputs` (
  libsql_vector_idx(`embedding`, 'metric=cosine')
);
