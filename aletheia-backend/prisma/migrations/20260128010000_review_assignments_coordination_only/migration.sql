-- =========================================================
-- Review Assignments: coordination-only metadata (ADR-015)
--
-- Adds:
-- - review_assignments table
--
-- Safety:
-- - Additive-only migration
-- - Idempotent across environments (IF NOT EXISTS + duplicate_object guards)
-- - Assignments DO NOT mutate claim lifecycle, status, or adjudication state
-- - Assignments are deleted when their ReviewRequest is deleted (ON DELETE CASCADE)
-- =========================================================

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_assignments" (
  "id" TEXT NOT NULL,
  "review_request_id" TEXT NOT NULL,
  "reviewer_user_id" TEXT NOT NULL,
  "assigned_by_user_id" TEXT NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_assignments_review_request_id_idx" ON "review_assignments"("review_request_id");
CREATE INDEX IF NOT EXISTS "review_assignments_reviewer_user_id_idx" ON "review_assignments"("reviewer_user_id");
CREATE INDEX IF NOT EXISTS "review_assignments_assigned_by_user_id_idx" ON "review_assignments"("assigned_by_user_id");
CREATE INDEX IF NOT EXISTS "review_assignments_assigned_at_idx" ON "review_assignments"("assigned_at");

-- Unique: idempotent per (review_request_id, reviewer_user_id)
DO $$ BEGIN
  ALTER TABLE "review_assignments"
    ADD CONSTRAINT "review_assignments_review_request_id_reviewer_user_id_key"
    UNIQUE ("review_request_id", "reviewer_user_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (ReviewRequest) - delete assignments when review request is deleted
DO $$ BEGIN
  ALTER TABLE "review_assignments"
    ADD CONSTRAINT "review_assignments_review_request_id_fkey"
    FOREIGN KEY ("review_request_id") REFERENCES "review_requests"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (User reviewer) - attribution only; delete assignments if user is deleted
DO $$ BEGIN
  ALTER TABLE "review_assignments"
    ADD CONSTRAINT "review_assignments_reviewer_user_id_fkey"
    FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (User assigned_by) - attribution only; delete assignments if user is deleted
DO $$ BEGIN
  ALTER TABLE "review_assignments"
    ADD CONSTRAINT "review_assignments_assigned_by_user_id_fkey"
    FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

