-- =========================================================
-- Aletheia contract evolution (evidence-first)
--
-- Adds:
-- - Structured document source metadata (DocumentSource)
-- - Exact entity mention spans (start/end offsets)
-- - Relationship evidence anchors (text spans on chunks)
--
-- Notes:
-- - Existing data is preserved.
-- - New tables use ON DELETE CASCADE to avoid breaking existing delete mutations:
--   deleting a Document / EntityRelationship must remain possible.
-- - No attempt is made to backfill sources from chunk 0 provenance headers; that
--   would require parsing heuristics and is intentionally deferred.
-- =========================================================

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "DocumentSourceKind" AS ENUM ('MANUAL', 'FILE', 'URL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "RelationshipEvidenceKind" AS ENUM ('TEXT_SPAN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "document_sources" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "kind" "DocumentSourceKind" NOT NULL,
    "ingested_at" TIMESTAMP(3),
    "content_sha256" TEXT,
    "filename" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "last_modified_ms" BIGINT,
    "file_sha256" TEXT,
    "requested_url" TEXT,
    "fetched_url" TEXT,
    "content_type" TEXT,
    "publisher" TEXT,
    "author" TEXT,
    "published_at" TIMESTAMP(3),
    "accessed_at" TIMESTAMP(3),
    CONSTRAINT "document_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "document_sources_document_id_key" ON "document_sources"("document_id");
CREATE INDEX IF NOT EXISTS "document_sources_kind_idx" ON "document_sources"("kind");
CREATE INDEX IF NOT EXISTS "document_sources_ingested_at_idx" ON "document_sources"("ingested_at");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "document_sources"
    ADD CONSTRAINT "document_sources_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: entity mention spans (nullable for legacy)
ALTER TABLE "entity_mentions"
  ADD COLUMN IF NOT EXISTS "start_offset" INTEGER,
  ADD COLUMN IF NOT EXISTS "end_offset" INTEGER,
  ADD COLUMN IF NOT EXISTS "span_text" TEXT,
  ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION;

-- CreateTable: relationship evidence anchors
CREATE TABLE IF NOT EXISTS "entity_relationship_evidence" (
    "id" TEXT NOT NULL,
    "relationship_id" TEXT NOT NULL,
    "chunk_id" TEXT NOT NULL,
    "kind" "RelationshipEvidenceKind" NOT NULL DEFAULT 'TEXT_SPAN',
    "start_offset" INTEGER,
    "end_offset" INTEGER,
    "quoted_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entity_relationship_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "entity_relationship_evidence_relationship_id_idx" ON "entity_relationship_evidence"("relationship_id");
CREATE INDEX IF NOT EXISTS "entity_relationship_evidence_chunk_id_idx" ON "entity_relationship_evidence"("chunk_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "entity_relationship_evidence"
    ADD CONSTRAINT "entity_relationship_evidence_relationship_id_fkey"
    FOREIGN KEY ("relationship_id") REFERENCES "entity_relationships"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "entity_relationship_evidence"
    ADD CONSTRAINT "entity_relationship_evidence_chunk_id_fkey"
    FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

