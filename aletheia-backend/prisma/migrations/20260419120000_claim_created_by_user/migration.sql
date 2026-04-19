-- ADR-035: Scope draft claims without evidence to their creator for workspace visibility.

ALTER TABLE "claims" ADD COLUMN "created_by_user_id" TEXT;

ALTER TABLE "claims" ADD CONSTRAINT "claims_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "claims_created_by_user_id_idx" ON "claims"("created_by_user_id");
