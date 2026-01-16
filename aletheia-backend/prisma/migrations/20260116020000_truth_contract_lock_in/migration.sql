-- =========================================================
-- Aletheia Backend Truth Contract Lock-In (v1)
--
-- Additive-only migration:
-- - Adds persisted document provenance summary fields
-- - Adds explicit evidence <-> mention join table for navigable linkage
--
-- Safety:
-- - All new columns are nullable.
-- - All new tables are created with IF NOT EXISTS.
-- - No data backfill is attempted (no inference).
-- =========================================================

-- AlterTable: document provenance summary (nullable for legacy)
ALTER TABLE "documents"
  ADD COLUMN IF NOT EXISTS "source_type" "DocumentSourceKind",
  ADD COLUMN IF NOT EXISTS "source_label" TEXT;

-- CreateTable: explicit evidence <-> mention links (no implicit m2m)
CREATE TABLE IF NOT EXISTS "entity_relationship_evidence_mentions" (
    "evidence_id" TEXT NOT NULL,
    "mention_id" TEXT NOT NULL,
    CONSTRAINT "entity_relationship_evidence_mentions_pkey" PRIMARY KEY ("evidence_id","mention_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "entity_relationship_evidence_mentions_mention_id_idx"
  ON "entity_relationship_evidence_mentions"("mention_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "entity_relationship_evidence_mentions"
    ADD CONSTRAINT "entity_relationship_evidence_mentions_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "entity_relationship_evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "entity_relationship_evidence_mentions"
    ADD CONSTRAINT "entity_relationship_evidence_mentions_mention_id_fkey"
    FOREIGN KEY ("mention_id") REFERENCES "entity_mentions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

