-- Custom migration (drizzle-kit generate --custom --name=extensions).
-- Do not put statement-breakpoint markers in comments — the migrator splits on them.
-- live is JS-only (extensions.live in client.ts); no SQL CREATE EXTENSION for it.
CREATE EXTENSION IF NOT EXISTS vector;
