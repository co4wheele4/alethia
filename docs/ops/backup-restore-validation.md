# Backup, export, and restore validation — Aletheia

**Purpose:** Ensure **structural** recoverability of claim/evidence/adjudication data without semantic “repair.” **ADR-031**, **ADR-037**, **ADR-027**.

---

## Export (snapshot bundle)

- GraphQL: `exportBundle` (see schema and `aletheia-bundle.service.ts`).
- Bundle must conform to `schemas/aletheiaBundle.schema.json`.
- **Testable locally / CI:** `aletheia-backend/src/bundle/aletheia-bundle.service.spec.ts` — round-trip and forbidden-key rejection.

---

## Import (restore)

- `importBundle` enforces ordering and epistemic constraints at the database layer (ADR-027).
- **Authoritative proof:** `aletheia-backend/test/e2e/bundle/bundle-import-adr027.e2e-spec.ts` (runs in **mvp-release-gate** with real Postgres).

---

## Operational drill (recommended)

1. Export a bundle from staging after known migrations.
2. Import into a **fresh** database with the same migration version.
3. Verify:
   - Row counts and key IDs match expectations for the test fixture.
   - Adjudication logs and evidence hashes present where expected.
   - **Failure cases:** intentionally malformed bundles are **rejected**, not partially “fixed.”

---

## What success does not mean

- Successful import does **not** mean content is “true”; it means **structural** integrity and schema/epistemic rules passed.

---

## Gaps

- Full **filesystem backup/restore** of Postgres is environment-specific; document RPO/RTO in your hosting provider’s runbook and link here.
