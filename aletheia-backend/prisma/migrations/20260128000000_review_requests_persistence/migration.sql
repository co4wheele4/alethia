-- =========================================================
-- Review Requests: persisted coordination artifacts (ADR-012/013)
--
-- Adds:
-- - ReviewRequestSource enum (CLAIM_VIEW / COMPARISON)
-- - review_requests table (read-only coordination layer)
--
-- Safety:
-- - Additive-only migration
-- - Idempotent across environments (IF NOT EXISTS + duplicate_object guards)
-- - Review requests DO NOT mutate claim lifecycle or truth semantics
-- - Review requests are deleted when their Claim is deleted (ON DELETE CASCADE)
-- =========================================================

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReviewRequestSource" AS ENUM ('CLAIM_VIEW', 'COMPARISON');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_requests" (
  "id" TEXT NOT NULL,
  "claim_id" TEXT NOT NULL,
  "requested_by_user_id" TEXT NOT NULL,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" "ReviewRequestSource" NOT NULL,
  "note" TEXT,
  CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_requests_claim_id_idx" ON "review_requests"("claim_id");
CREATE INDEX IF NOT EXISTS "review_requests_requested_by_user_id_idx" ON "review_requests"("requested_by_user_id");
CREATE INDEX IF NOT EXISTS "review_requests_requested_at_idx" ON "review_requests"("requested_at");
CREATE INDEX IF NOT EXISTS "review_requests_source_idx" ON "review_requests"("source");

-- Unique: idempotent per (claim_id, requested_by_user_id)
DO $$ BEGIN
  ALTER TABLE "review_requests"
    ADD CONSTRAINT "review_requests_claim_id_requested_by_user_id_key"
    UNIQUE ("claim_id", "requested_by_user_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (Claim) - delete review requests when claim is deleted
DO $$ BEGIN
  ALTER TABLE "review_requests"
    ADD CONSTRAINT "review_requests_claim_id_fkey"
    FOREIGN KEY ("claim_id") REFERENCES "claims"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (User) - attribution only; delete requests if user is deleted
DO $$ BEGIN
  ALTER TABLE "review_requests"
    ADD CONSTRAINT "review_requests_requested_by_user_id_fkey"
    FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

