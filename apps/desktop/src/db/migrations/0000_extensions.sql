-- Custom: enable pgvector (must run before tables that use `vector(n)`).
-- `live` is JS-only — register via `extensions: { live }` in client.ts; there is no
-- SQL `CREATE EXTENSION live` in this PGlite build (pg_available_extensions).
CREATE EXTENSION IF NOT EXISTS vector;
