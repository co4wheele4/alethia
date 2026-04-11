# ADR-008: Claim Lifecycle & Review States

## Status
Status: ACCEPTED

## Date
2026-01-22

## Context

Aletheia distinguishes **evidence** from **claims**.

Evidence is atomic, traceable, and factual.
Claims are higher-order semantic assertions derived from evidence.

Without explicit lifecycle semantics, claims risk being:
- Treated as facts prematurely
- Confused with evidence
- Assigned implicit confidence
- Used operationally before review

This ADR defines the **allowed lifecycle states for claims** and how the frontend must interpret them.

---

## Decision

Claims are **reviewable semantic artifacts**, not facts.

Every claim MUST have an explicit lifecycle state.
Lifecycle state affects **presentation only**, not truth value or confidence.

---

## Claim Lifecycle States

### 1. DRAFT
- Newly extracted or generated
- Not reviewed by a human
- MUST be clearly labeled as provisional
- MUST NOT be treated as authoritative

### 2. REVIEWED
- Inspected by a human
- Evidence confirmed to be correctly linked
- Still not an assertion of truth

### 3. ACCEPTED
- Human-approved as a valid claim
- Evidence deemed sufficient
- Still does NOT imply confidence or probability

### 4. REJECTED
- Human-reviewed and invalidated
- Evidence insufficient, misleading, or contradictory
- Must remain inspectable for audit purposes

---

## Frontend Semantics

- Claims MUST be visually distinguished by lifecycle state
- Lifecycle state MUST NOT affect evidence rendering
- Rejected claims MUST remain visible (auditability)
- No lifecycle state may introduce confidence semantics

---

## Prohibited Assumptions

The frontend MUST NOT:
- Assign numeric meaning to lifecycle states
- Treat ACCEPTED as “true”
- Hide REJECTED claims
- Infer confidence from state
- Collapse evidence based on state

---

## Relationship to Other ADRs

- **ADR-005**: Claims inherit evidence guarantees
- **ADR-006**: Claims never expose confidence
- **ADR-007**: Claims do not replace evidence
- **ADR-004**: Claims are a higher UI layer than evidence

---

## Consequences

### Positive
- Clear semantic separation
- Audit-friendly workflows
- Prevents premature trust escalation
- Supports future review tooling

### Negative
- Requires discipline in UI labeling
- Slightly more complex mental model

---

## Decision Outcome

Claims are **reviewable interpretations**, not facts.
Evidence remains the only ground truth.
