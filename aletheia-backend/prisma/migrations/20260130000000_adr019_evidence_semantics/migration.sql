-- =========================================================
-- ADR-019: Evidence Semantics & Structure
--
-- Adds:
-- - EvidenceSourceKind enum (DOCUMENT, URL)
-- - evidence table (strict, immutable, referential contract)
-- - claim_evidence_links join table (Evidence <-> Claim, many-to-many)
--
-- Data migration: Run scripts/migrate-claim-evidence-to-adr019.cjs
-- after applying this migration. See docs/adr/ADR-019-evidence-semantics-structure.md § Migration Path.
--
-- Immutability: No update mutation for Evidence. Corrections require new records.
-- =========================================================

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "EvidenceSourceKind" AS ENUM ('DOCUMENT', 'URL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: evidence
CREATE TABLE IF NOT EXISTS "evidence" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT NOT NULL,
  "source_type" "EvidenceSourceKind" NOT NULL,
  "source_document_id" TEXT,
  "source_url" TEXT,
  "chunk_id" TEXT,
  "start_offset" INTEGER,
  "end_offset" INTEGER,
  "snippet" TEXT,
  CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "evidence_source_document_id_idx" ON "evidence"("source_document_id");
CREATE INDEX IF NOT EXISTS "evidence_chunk_id_idx" ON "evidence"("chunk_id");
CREATE INDEX IF NOT EXISTS "evidence_created_by_idx" ON "evidence"("created_by");
CREATE INDEX IF NOT EXISTS "evidence_created_at_idx" ON "evidence"("created_at");

-- CreateTable: claim_evidence_links
CREATE TABLE IF NOT EXISTS "claim_evidence_links" (
  "evidence_id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_evidence_links_pkey" PRIMARY KEY ("evidence_id","claim_id")
);

CREATE INDEX IF NOT EXISTS "claim_evidence_links_claim_id_idx" ON "claim_evidence_links"("claim_id");
CREATE INDEX IF NOT EXISTS "claim_evidence_links_evidence_id_idx" ON "claim_evidence_links"("evidence_id");

-- AddForeignKey: evidence.created_by -> users
DO $$ BEGIN
  ALTER TABLE "evidence"
    ADD CONSTRAINT "evidence_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: evidence.source_document_id -> documents
DO $$ BEGIN
  ALTER TABLE "evidence"
    ADD CONSTRAINT "evidence_source_document_id_fkey"
    FOREIGN KEY ("source_document_id") REFERENCES "documents"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: evidence.chunk_id -> document_chunks
DO $$ BEGIN
  ALTER TABLE "evidence"
    ADD CONSTRAINT "evidence_chunk_id_fkey"
    FOREIGN KEY ("chunk_id") REFERENCES "document_chunks"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: claim_evidence_links.evidence_id -> evidence
DO $$ BEGIN
  ALTER TABLE "claim_evidence_links"
    ADD CONSTRAINT "claim_evidence_links_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: claim_evidence_links.claim_id -> claims
DO $$ BEGIN
  ALTER TABLE "claim_evidence_links"
    ADD CONSTRAINT "claim_evidence_links_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "claims"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
