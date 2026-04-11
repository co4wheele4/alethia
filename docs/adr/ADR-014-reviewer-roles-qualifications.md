# ADR-014: Reviewer Roles & Qualifications

## Status
Status: PROPOSED

## Date
2026-01-27

## Context

As Aletheia evolves from single-reviewer adjudication toward multi-reviewer governance, it becomes necessary to **explicitly distinguish who is allowed to review what, and under which authority**.

Without formal role and qualification semantics:
- Adjudication authority becomes ambiguous
- Review outcomes risk being perceived as arbitrary
- Future multi-reviewer or weighted-review systems become difficult to introduce safely
- Trust boundaries between contributors, reviewers, and administrators blur

This ADR defines **reviewer roles and qualifications** while preserving the core epistemic principle:
> *Truth claims are adjudicated by qualified agents under explicit authority.*

This ADR intentionally **does not** introduce backend enforcement yet.

---

## Governing ADRs

This ADR is governed by:

- **ADR-005** — GraphQL Contract & Data Guarantees
- **ADR-008** — Claim Lifecycle & Review States
- **ADR-011** — Claim Adjudication API Contract
- **ADR-012** — Review Request Semantics
- **ADR-013** — Reviewer Queues

---

## Definitions

### Reviewer
A **Reviewer** is a user authorized to adjudicate claims.

Authorization is role-based, not inferred.

---

### Qualification
A **Qualification** is a non-exclusive credential or attribute that may justify review authority for certain claim types or domains.

Examples:
- Domain expertise (e.g., medicine, law, history)
- Organizational role (e.g., editor, moderator)
- Trust level (e.g., senior reviewer)

Qualifications may be:
- Declared
- Assigned
- Verified
- Or external (future)

---

## Roles

### Contributor
- May submit documents and claims
- May request review
- **May not adjudicate claims**

---

### Reviewer
- May adjudicate claims via explicit mutation (ADR-011)
- May accept or reject claims
- Authority is scoped (see Qualifications)

---

### Senior Reviewer (Future)
- May adjudicate contested claims
- May override prior adjudications (future ADR)
- May participate in conflict resolution

---

### Administrator (Out of Scope)
- System governance
- User management
- Schema evolution
- Not involved in truth adjudication

---

## Scope & Authority

Review authority MUST be:

- Explicit
- Auditable
- Scoped

A reviewer’s authority MAY be constrained by:
- Claim type
- Domain
- Evidence source
- Workspace or project

The frontend MUST NOT assume universal reviewer authority.

---

## Frontend Semantics (Current Phase)

Until backend support exists:

- Reviewer roles are **implicitly inferred only for UX**
- No UI may assert “you are qualified”
- All review actions must defer to backend authorization
- Unauthorized attempts must surface `UNAUTHORIZED_REVIEWER`

The frontend MAY:
- Label actions as “Requires reviewer permissions”
- Display reviewer attribution (`reviewedBy`) when present

---

## Non-Goals (Explicit)

This ADR does NOT define:

- Qualification storage
- Role assignment mechanics
- Weighted voting
- Reviewer ranking
- Consensus algorithms

These require future ADRs and schema changes.

---

## Testing Implications

- UI tests MUST treat reviewer permissions as opaque
- No MSW mocks may simulate role elevation
- Playwright tests MUST assert authorization errors when appropriate

---

## Future Extensions

Possible future ADRs may introduce:
- Reviewer qualification schemas
- Multi-reviewer adjudication
- Conflict resolution panels
- Weighted evidence review

These must not retroactively weaken existing contracts.

---

## Consequences

### Positive
- Clear authority boundaries
- Preserves trust semantics
- Enables safe governance scaling

### Negative
- Limits early UX expressiveness
- Requires explicit backend evolution

These constraints are intentional.

---

## Decision Outcome

This ADR defines **conceptual reviewer authority** and prepares the system for future qualification-aware adjudication without violating existing contracts.
