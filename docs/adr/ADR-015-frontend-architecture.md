# ADR-015: Reviewer Assignment Semantics

## Status
Proposed

## Date
2026-01-27

## Context

Aletheia distinguishes **review coordination** from **truth adjudication**.

Review requests exist to surface claims requiring attention.
Assignment of reviewers introduces authority, responsibility, and trust implications.

Premature assignment risks:
- Implicit endorsement
- Authority leakage
- Undocumented reviewer qualifications

---

## Decision

Reviewer assignment MUST be an explicit, auditable action.

It MUST NOT be inferred from:
- Queue presence
- Review request creation
- Reviewer viewing a claim

---

## Rules

1. A ReviewRequest does NOT imply assignment.
2. A reviewer is unassigned until explicitly assigned by:
   - System policy
   - Authorized coordinator
3. Assignment MUST be persisted and reversible.
4. Assignment MUST NOT change claim lifecycle.

---

## Non-Goals

- Auto-assignment
- Expertise inference
- Consensus modeling

---

## UI Implications

- Queues show “Unassigned”
- Claim review page must state reviewer role explicitly
- No adjudication buttons unless reviewer is assigned

---

## Consequences

### Positive
- Clear authority boundaries
- Auditable review responsibility
- Prevents silent trust elevation

### Negative
- Additional coordination steps
- Slightly slower review throughput

---

## Outcome

Deferred until after ReviewRequest persistence is complete.
