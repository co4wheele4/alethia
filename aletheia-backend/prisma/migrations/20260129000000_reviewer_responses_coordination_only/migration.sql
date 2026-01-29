-- =========================================================
-- Reviewer Responses: coordination-only acknowledgements/declines (ADR-016)
--
-- Adds:
-- - ReviewerResponse enum
-- - reviewer_responses table
--
-- Safety:
-- - Additive-only migration
-- - Idempotent across environments (IF NOT EXISTS + duplicate_object guards)
-- - Responses DO NOT mutate claim lifecycle, status, adjudication, or evidence
-- - Responses are deleted when their ReviewAssignment is deleted (ON DELETE CASCADE)
-- =========================================================

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReviewerResponseType" AS ENUM ('ACKNOWLEDGED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "reviewer_responses" (
  "id" TEXT NOT NULL,
  "review_assignment_id" TEXT NOT NULL,
  "reviewer_user_id" TEXT NOT NULL,
  "response" "ReviewerResponseType" NOT NULL,
  "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  CONSTRAINT "reviewer_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviewer_responses_review_assignment_id_idx" ON "reviewer_responses"("review_assignment_id");
CREATE INDEX IF NOT EXISTS "reviewer_responses_reviewer_user_id_idx" ON "reviewer_responses"("reviewer_user_id");
CREATE INDEX IF NOT EXISTS "reviewer_responses_responded_at_idx" ON "reviewer_responses"("responded_at");

-- Unique: one response per (review_assignment_id, reviewer_user_id)
DO $$ BEGIN
  ALTER TABLE "reviewer_responses"
    ADD CONSTRAINT "reviewer_responses_review_assignment_id_reviewer_user_id_key"
    UNIQUE ("review_assignment_id", "reviewer_user_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (ReviewAssignment) - delete responses when assignment is deleted
DO $$ BEGIN
  ALTER TABLE "reviewer_responses"
    ADD CONSTRAINT "reviewer_responses_review_assignment_id_fkey"
    FOREIGN KEY ("review_assignment_id") REFERENCES "review_assignments"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (User reviewer) - attribution only; delete responses if user is deleted
DO $$ BEGIN
  ALTER TABLE "reviewer_responses"
    ADD CONSTRAINT "reviewer_responses_reviewer_user_id_fkey"
    FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

