-- ADR-024: Verbatim content digest + immutability guard for evidence rows.
-- (Backfill of content_sha256 for legacy rows may be done offline; new rows always set the hash in application code.)

ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "content_sha256" TEXT;

CREATE OR REPLACE FUNCTION evidence_prevent_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'EVIDENCE_IMMUTABLE'
    USING ERRCODE = 'P0001',
          HINT = 'ADR-024: evidence rows are append-only; updates are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evidence_immutable_guard ON "evidence";
CREATE TRIGGER evidence_immutable_guard
  BEFORE UPDATE ON "evidence"
  FOR EACH ROW
  EXECUTE PROCEDURE evidence_prevent_update();
