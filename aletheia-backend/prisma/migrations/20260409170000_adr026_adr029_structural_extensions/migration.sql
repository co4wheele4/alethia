-- ADR-026: Evidence reproducibility checks (append-only audit rows).
-- ADR-029: Epistemic observability events (audit only).

-- EvidenceReproFetchStatus
DO $$ BEGIN
  CREATE TYPE "EvidenceReproFetchStatus" AS ENUM ('SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- EvidenceReproHashMatch
DO $$ BEGIN
  CREATE TYPE "EvidenceReproHashMatch" AS ENUM ('MATCH', 'MISMATCH', 'UNKNOWN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "evidence_repro_checks" (
    "id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fetch_status" "EvidenceReproFetchStatus" NOT NULL,
    "hash_match" "EvidenceReproHashMatch" NOT NULL,
    "fetched_hash" TEXT,
    "error_message" TEXT,

    CONSTRAINT "evidence_repro_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "evidence_repro_checks_evidence_id_idx" ON "evidence_repro_checks"("evidence_id");
CREATE INDEX IF NOT EXISTS "evidence_repro_checks_checked_at_idx" ON "evidence_repro_checks"("checked_at");

DO $$ BEGIN
  ALTER TABLE "evidence_repro_checks"
    ADD CONSTRAINT "evidence_repro_checks_evidence_id_fkey"
    FOREIGN KEY ("evidence_id") REFERENCES "evidence"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- EpistemicEventType
DO $$ BEGIN
  CREATE TYPE "EpistemicEventType" AS ENUM ('GOVERNANCE_GRAPHQL_ERROR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "epistemic_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "EpistemicEventType" NOT NULL,
    "actor_id" TEXT,
    "target_id" TEXT,
    "error_code" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "epistemic_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "epistemic_events_created_at_idx" ON "epistemic_events"("created_at");
CREATE INDEX IF NOT EXISTS "epistemic_events_error_code_idx" ON "epistemic_events"("error_code");
