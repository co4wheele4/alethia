-- ADR-036: Tamper-evident append-only hash chain for adjudication logs.

ALTER TABLE "adjudication_logs" ADD COLUMN "prev_hash" TEXT;
ALTER TABLE "adjudication_logs" ADD COLUMN "entry_hash" TEXT;
