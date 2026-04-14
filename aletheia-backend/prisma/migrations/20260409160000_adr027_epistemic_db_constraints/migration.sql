-- ADR-027: Database-level epistemic constraints (triggers).
--
-- Rollback (manual): run the statements in migration_down.sql in this folder.

-- Block any UPDATE to persisted evidence rows (immutability).
CREATE OR REPLACE FUNCTION forbid_evidence_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'EVIDENCE_IMMUTABLE';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_evidence_forbid_update ON evidence;
CREATE TRIGGER trg_evidence_forbid_update
  BEFORE UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION forbid_evidence_update();

-- Enforce claim lifecycle preconditions when status is written.
CREATE OR REPLACE FUNCTION enforce_claim_status_epistemic()
RETURNS TRIGGER AS $$
DECLARE
  has_evidence BOOLEAN;
BEGIN
  has_evidence := EXISTS (
    SELECT 1 FROM claim_evidence_links WHERE claim_id = NEW.id
  ) OR EXISTS (
    SELECT 1 FROM claim_evidence WHERE claim_id = NEW.id
  );

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'REVIEWED'::"ClaimStatus" AND NOT has_evidence THEN
      RAISE EXCEPTION 'CLAIM_REVIEW_REQUIRES_EVIDENCE';
    END IF;
    IF NEW.status IN ('ACCEPTED'::"ClaimStatus", 'REJECTED'::"ClaimStatus") THEN
      IF NOT has_evidence THEN
        RAISE EXCEPTION 'CLAIM_TERMINAL_REQUIRES_EVIDENCE';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM adjudication_logs
        WHERE claim_id = NEW.id AND new_status = NEW.status
      ) THEN
        RAISE EXCEPTION 'CLAIM_TERMINAL_REQUIRES_ADJUDICATION_LOG';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'REVIEWED'::"ClaimStatus" AND NOT has_evidence THEN
      RAISE EXCEPTION 'CLAIM_REVIEW_REQUIRES_EVIDENCE';
    END IF;
    IF NEW.status IN ('ACCEPTED'::"ClaimStatus", 'REJECTED'::"ClaimStatus") THEN
      IF NOT has_evidence THEN
        RAISE EXCEPTION 'CLAIM_TERMINAL_REQUIRES_EVIDENCE';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM adjudication_logs
        WHERE claim_id = NEW.id AND new_status = NEW.status
      ) THEN
        RAISE EXCEPTION 'CLAIM_TERMINAL_REQUIRES_ADJUDICATION_LOG';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_claims_epistemic_enforcement ON claims;
CREATE TRIGGER trg_claims_epistemic_enforcement
  BEFORE INSERT OR UPDATE ON claims
  FOR EACH ROW
  EXECUTE FUNCTION enforce_claim_status_epistemic();
