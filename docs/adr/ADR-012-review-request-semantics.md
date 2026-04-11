# ADR-012: Review Request Semantics

## Status
Status: SUPERSEDED

## SupersededBy
ADR-014

## Date
2026-01-27

This ADR is historical only and MUST NOT be referenced as governing authority.

> ⚠️ **Superseded**
>
> This ADR is superseded by **ADR-014 — Supersession of ADR-012 and ADR-013 (Review Coordination Persistence)**.
>
> Status: **Superseded**
>
> This document is retained for historical context only and is no longer authoritative.
> Its constraints MUST NOT be enforced against the current system.
> This document MUST NOT be cited for validation or correctness.

## Context

Aletheia enables users to inspect, compare, and adjudicate claims based on explicit evidence.
After introducing claim comparison (ADR-009, ADR-010), a new user need emerges:

> “I see claims that appear to disagree — how do I ask for human review without resolving them?”

Premature automation (conflict detection, lifecycle mutation) would violate Aletheia’s core principle:
**truth disclosure without inference**.

---

## Decision

Introduce a **Review Request** interaction that:

- Is **explicit**
- Is **non-mutating**
- Is **non-persistent**
- Signals **human governance**, not resolution

---

## Definition: Review Request

A *Review Request* is a **user action**, not a domain state.

It:
- Does NOT modify claim lifecycle
- Does NOT persist to the backend
- Does NOT infer conflict or correctness
- DOES provide navigational context for human adjudication

---

## Semantics

### What Review Request Means
- “This claim warrants human inspection”
- “This comparison reveals potential disagreement”
- “Further adjudication may be required”

### What Review Request Does NOT Mean
- The claim is wrong
- The claim is conflicted
- The claim is under review in the system
- The system has detected an error

---

## UI Requirements

- Review Request MUST:
  - Be explicitly labeled
  - Explain that no state change occurs
  - Avoid adjudication language

- The UI MUST NOT:
  - Show lifecycle changes
  - Show confidence deltas
  - Simulate persistence

---

## Technical Constraints

- No new backend API
- No GraphQL mutation
- No database persistence
- Navigation-only behavior is allowed

---

## Relationship to Other ADRs

- **ADR-005**: Review Request must not assume unavailable schema fields
- **ADR-009**: Triggered from claim comparison
- **ADR-010**: UI must remain evidence-first and neutral
- **ADR-011**: Review Request precedes (but does not perform) adjudication

---

## Consequences

### Positive
- Preserves epistemic humility
- Enables governance workflows
- Keeps frontend schema-faithful
- Avoids premature automation

### Negative
- Review intent is not persisted
- Requires human follow-through

This tradeoff is intentional.

---

## Outcome

Review Request is adopted as a **non-mutating, navigational affordance** that bridges
claim comparison and adjudication without violating Aletheia’s truth-first design principles.
