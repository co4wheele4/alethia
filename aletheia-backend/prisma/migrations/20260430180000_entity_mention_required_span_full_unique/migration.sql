-- Require anchored spans on entity_mentions and enforce global uniqueness on (entity, chunk, offsets).
-- Drops the partial unique index (non-null subset only) in favor of a full unique index.

DELETE FROM "entity_mentions"
WHERE "start_offset" IS NULL OR "end_offset" IS NULL;

DROP INDEX IF EXISTS "entity_mentions_entity_chunk_span_partial_uniq";

ALTER TABLE "entity_mentions"
  ALTER COLUMN "start_offset" SET NOT NULL,
  ALTER COLUMN "end_offset" SET NOT NULL;

CREATE UNIQUE INDEX "entity_mentions_entity_chunk_span_key"
ON "entity_mentions" ("entity_id", "chunk_id", "start_offset", "end_offset");
