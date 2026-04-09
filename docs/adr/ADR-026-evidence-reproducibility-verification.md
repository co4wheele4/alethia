# ADR-026: Evidence Reproducibility Verification

## Status

Status: ACCEPTED

## Date

2026-04-09

---

## Context

Evidence rows store a content hash and optional source reference (ADR-019, ADR-024). For audit and operational assurance, the platform needs a **mechanical** way to record whether a later fetch of the same source material still matches the stored hash.

This capability must not introduce semantic authority: it is a **re-fetch and compare** audit, not a verdict on claim truth or evidence quality.

---

## Decision

Aletheia SHALL persist **reproducibility check** records per evidence id when a job or operator runs the check. Results are exposed read-only via GraphQL (`evidenceReproChecks`).

Checks record:

- Fetch outcome (`EvidenceReproFetchStatus`)
- Hash comparison outcome (`EvidenceReproHashMatch`), including `UNKNOWN` when comparison is not applicable
- Timestamps and optional error text for operational debugging

The UI MAY surface these rows as a **table of audit outcomes** on the evidence detail route. The UI MUST NOT present them as confidence, scoring, or “trust” metrics.

---

## Rules

1. **No semantic interpretation** — Reproducibility results describe fetch/hash mechanics only; they MUST NOT be used to rank claims or evidence.
2. **Immutability of evidence** — Evidence content used for display remains governed by ADR-019/024; this ADR adds **append-only check history**, not evidence mutation.
3. **Agent alignment** — Automated jobs MAY run checks per ADR-025 (mechanical automation only).

---

## Implementation (repository)

- Persistence and migration: shared structural migration with ADR-029 (`aletheia-backend/prisma/migrations/20260409170000_adr026_adr029_structural_extensions/`).
- Service: `aletheia-backend/src/evidence-repro/evidence-repro-check.service.ts`
- GraphQL: `evidenceReproChecks(evidenceId)` in `aletheia-backend/src/graphql/resolvers/evidence-repro.resolver.ts`
- Job: `scripts/jobs/runEvidenceReproCheck.ts` (see `docs/dev/ops.md`)

---

## Relationship to Other ADRs

- **ADR-019 / ADR-024** — Evidence structure and ingestion hashing; ADR-026 verifies consistency over time.
- **ADR-025** — Permitted agent/worker role for mechanical repro checks.

---

## Consequences

### Positive

- Auditable trail when source bytes or URLs are re-fetched.
- Clear separation from adjudication and review coordination.

### Negative

- Extra storage and optional background job operations; operators must schedule or run the job explicitly.
