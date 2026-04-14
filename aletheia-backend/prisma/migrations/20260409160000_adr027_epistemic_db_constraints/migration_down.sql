-- Manual rollback for ADR-027 (not executed by Prisma migrate).

DROP TRIGGER IF EXISTS trg_claims_epistemic_enforcement ON claims;
DROP FUNCTION IF EXISTS enforce_claim_status_epistemic();

DROP TRIGGER IF EXISTS trg_evidence_forbid_update ON evidence;
DROP FUNCTION IF EXISTS forbid_evidence_update();
