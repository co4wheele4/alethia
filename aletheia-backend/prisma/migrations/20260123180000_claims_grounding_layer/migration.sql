-- =========================================================
-- Claims: inspection-only assertion layer (grounded in evidence)
--
-- Adds:
-- - ClaimStatus enum (DRAFT/REVIEWED/ACCEPTED/REJECTED)
-- - claims table (read-only semantic layer)
-- - claim_evidence table (explicit grounding anchors)
-- - claim_evidence_mentions join (evidence -> mention IDs)
-- - claim_evidence_relationships join (evidence -> relationship IDs)
--
-- Safety:
-- - Additive-only migration
-- - All new tables are created with IF NOT EXISTS
-- - No data backfill is attempted (no inference)
-- =========================================================

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'REVIEWED', 'ACCEPTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: claims
CREATE TABLE IF NOT EXISTS "claims" (
  "id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "claims_status_idx" ON "claims"("status");
CREATE INDEX IF NOT EXISTS "claims_created_at_idx" ON "claims"("created_at");

-- CreateTable: claim evidence anchors
CREATE TABLE IF NOT EXISTS "claim_evidence" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "document_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "claim_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "claim_evidence_claim_id_idx" ON "claim_evidence"("claim_id");
CREATE INDEX IF NOT EXISTS "claim_evidence_document_id_idx" ON "claim_evidence"("document_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "claim_evidence"
    ADD CONSTRAINT "claim_evidence_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "claims"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "claim_evidence"
    ADD CONSTRAINT "claim_evidence_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: explicit claim evidence <-> mention links
CREATE TABLE IF NOT EXISTS "claim_evidence_mentions" (
  "evidence_id" TEXT NOT NULL,
  "mention_id" TEXT NOT NULL,
  CONSTRAINT "claim_evidence_mentions_pkey" PRIMARY KEY ("evidence_id","mention_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "claim_evidence_mentions_mention_id_idx" ON "claim_evidence_mentions"("mention_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "claim_evidence_mentions"
    ADD CONSTRAINT "claim_evidence_mentions_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "claim_evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "claim_evidence_mentions"
    ADD CONSTRAINT "claim_evidence_mentions_mention_id_fkey"
    FOREIGN KEY ("mention_id") REFERENCES "entity_mentions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: explicit claim evidence <-> relationship links
CREATE TABLE IF NOT EXISTS "claim_evidence_relationships" (
  "evidence_id" TEXT NOT NULL,
  "relationship_id" TEXT NOT NULL,
  CONSTRAINT "claim_evidence_relationships_pkey" PRIMARY KEY ("evidence_id","relationship_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "claim_evidence_relationships_relationship_id_idx"
  ON "claim_evidence_relationships"("relationship_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "claim_evidence_relationships"
    ADD CONSTRAINT "claim_evidence_relationships_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "claim_evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "claim_evidence_relationships"
    ADD CONSTRAINT "claim_evidence_relationships_relationship_id_fkey"
    FOREIGN KEY ("relationship_id") REFERENCES "entity_relationships"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

