-- ADR-023: Immutable adjudication audit log (append-only rows per adjudicateClaim).

CREATE TABLE "adjudication_logs" (
    "id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "adjudicator_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "previous_status" "ClaimStatus" NOT NULL,
    "new_status" "ClaimStatus" NOT NULL,
    "reviewer_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjudication_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "adjudication_logs_claim_id_idx" ON "adjudication_logs"("claim_id");
CREATE INDEX "adjudication_logs_adjudicator_id_idx" ON "adjudication_logs"("adjudicator_id");
CREATE INDEX "adjudication_logs_created_at_idx" ON "adjudication_logs"("created_at");

ALTER TABLE "adjudication_logs" ADD CONSTRAINT "adjudication_logs_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
