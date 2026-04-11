# ADR-013: Reviewer Queues

## Status
Status: SUPERSEDED

## Date
2026-01-27

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

As Aletheia evolves from individual claim inspection toward structured adjudication (ADR-011) and explicit review intent (ADR-012), a coordination problem emerges:

> How do claims move from “someone noticed this” to “a qualified human reviews it”?

Currently:
- Claims can be adjudicated directly if accessed
- Review intent is non-persistent and navigational only
- There is no concept of *review workload*, *ownership*, or *triage*

Without a formal reviewer queue:
- Review becomes opportunistic and opaque
- Claims may be over-reviewed or never reviewed
- Governance and auditability are weakened

---

## Decision

Introduce **Reviewer Queues** as a **first-class governance concept** that coordinates human review **without altering claim truth semantics**.

Reviewer queues:
- Organize *who should review what*
- Do **not** determine claim correctness
- Do **not** infer confidence or conflict
- Do **not** replace adjudication decisions

They exist to manage **human process**, not epistemic state.

---

## Definitions

### Reviewer Queue

A *Reviewer Queue* is a collection of claims awaiting human review, scoped by:
- Workspace / organization
- Reviewer role or qualification
- Review intent source

Queues are **orthogonal** to claim lifecycle state.

---

## Core Principles

1. **Separation of Concerns**
   - Claim truth ≠ review logistics
   - Adjudication remains explicit and manual (ADR-011)

2. **Explicitness Over Inference**
   - Claims enter queues only through explicit actions
   - No automatic conflict detection places claims in queues

3. **Auditability**
   - Queue membership and review actions must be traceable

4. **Non-Blocking**
   - Claims may be adjudicated without ever entering a queue
   - Queues assist governance; they do not gate it

---

## Queue Entry Semantics

A claim MAY enter a reviewer queue via:
- Explicit “Request Review” action (ADR-012)
- Manual triage by an administrator
- Import from an external governance system

A claim MUST NOT enter a queue due to:
- Automated confidence thresholds
- Implicit conflict detection
- Heuristic disagreement

---

## Queue States (Queue-Level Only)

Queues MAY track:
- `PENDING`
- `ASSIGNED`
- `IN_PROGRESS`
- `COMPLETED`

These states:
- Apply to **queue membership**
- Do NOT modify claim lifecycle
- Do NOT imply claim correctness

---

## Reviewer Assignment

Reviewer assignment:
- Is explicit
- Is reversible
- Does not lock claims

Multiple reviewers MAY:
- Independently review the same claim
- Produce independent adjudications (future ADR)

---

## UI Implications (Non-Binding)

Future UI MAY include:
- “My Review Queue”
- “Unassigned Reviews”
- Claim review counts
- Review activity timelines

UI MUST NOT:
- Auto-accept/reject claims
- Collapse review state into claim state
- Hide evidence during review

---

## Backend Implications (Deferred)

This ADR does **not** require immediate backend changes.

If implemented later, reviewer queues likely require:
- A queue membership model
- Assignment metadata
- Event logging

These are explicitly deferred.

---

## Relationship to Other ADRs

- **ADR-005**: No frontend assumptions beyond schema
- **ADR-009**: Queues may be populated from comparison views
- **ADR-010**: UI remains evidence-first
- **ADR-011**: Adjudication remains explicit and terminal
- **ADR-012**: Review Request is a primary queue entry mechanism

---

## Consequences

### Positive
- Scales human review
- Enables governance workflows
- Preserves epistemic discipline
- Improves auditability

### Negative
- Adds conceptual overhead
- Requires future backend coordination
- Does not automate resolution

These tradeoffs are intentional.

---

## Outcome

Reviewer Queues are adopted as a **future-facing governance abstraction** that enables
structured human review **without compromising Aletheia’s truth-first design**.

Implementation is deferred until explicitly authorized by schema and product needs.
