-- =========================================================
-- AI extraction suggestions + delete safety
--
-- Adds:
-- - ai_extraction_suggestions table + enums (used by DocumentChunk.aiSuggestions)
--
-- Fixes:
-- - Ensure deleting a Document works even when it has chunks by cascading deletes:
--   documents -> document_chunks -> (embeddings, entity_mentions, relationship evidence, ai suggestions)
--
-- Note:
-- - This is required for the frontend Documents dashboard flow:
--   ingest creates chunks, and the UI must be able to delete the document afterwards.
-- =========================================================

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SuggestionKind" AS ENUM ('ENTITY_MENTION', 'RELATIONSHIP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_extraction_suggestions" (
  "id" TEXT NOT NULL,
  "chunk_id" TEXT NOT NULL,
  "kind" "SuggestionKind" NOT NULL,
  "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',

  "entity_name" TEXT,
  "entity_type" TEXT,

  "subject_name" TEXT,
  "subject_type" TEXT,
  "object_name" TEXT,
  "object_type" TEXT,
  "relation" TEXT,

  "start_offset" INTEGER,
  "end_offset" INTEGER,
  "excerpt" TEXT,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_extraction_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_extraction_suggestions_chunk_id_idx" ON "ai_extraction_suggestions"("chunk_id");
CREATE INDEX IF NOT EXISTS "ai_extraction_suggestions_status_idx" ON "ai_extraction_suggestions"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "ai_extraction_suggestions"
    ADD CONSTRAINT "ai_extraction_suggestions_chunk_id_fkey"
    FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =========================================================
-- Cascade deletes for the document deletion path
-- =========================================================

-- Document -> chunks should cascade
ALTER TABLE "document_chunks" DROP CONSTRAINT IF EXISTS "document_chunks_document_id_fkey";
ALTER TABLE "document_chunks"
  ADD CONSTRAINT "document_chunks_document_id_fkey"
  FOREIGN KEY ("document_id") REFERENCES "documents"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Chunk -> embeddings should cascade
ALTER TABLE "embeddings" DROP CONSTRAINT IF EXISTS "embeddings_chunk_id_fkey";
ALTER TABLE "embeddings"
  ADD CONSTRAINT "embeddings_chunk_id_fkey"
  FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Chunk -> entity mentions should cascade (mentions are evidence-level linkage)
ALTER TABLE "entity_mentions" DROP CONSTRAINT IF EXISTS "entity_mentions_chunk_id_fkey";
ALTER TABLE "entity_mentions"
  ADD CONSTRAINT "entity_mentions_chunk_id_fkey"
  FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

