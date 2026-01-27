-- =========================================================
-- Claims: adjudication metadata (ADR-011)
--
-- Adds (nullable for backward safety):
-- - reviewed_at   TIMESTAMP
-- - reviewed_by   TEXT (authenticated reviewer user id)
-- - reviewer_note TEXT
--
-- Safety:
-- - Additive-only migration
-- - Uses IF NOT EXISTS to be idempotent across environments
-- - No data backfill is attempted (no inference)
-- =========================================================

ALTER TABLE "claims"
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3);

ALTER TABLE "claims"
  ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;

ALTER TABLE "claims"
  ADD COLUMN IF NOT EXISTS "reviewer_note" TEXT;

