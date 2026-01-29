# ADR-015: Reviewer Assignment Semantics

## Status
Proposed

## Date
2026-01-28

## Context

Aletheia supports persisted **Review Requests** (ADR-012) as a coordination mechanism to surface claims that require human attention. Review requests are intentionally non-authoritative and do not change claim truth, lifecycle, or adjudication state.

As review volume grows, the system must support **assignment for coordination purposes** only:
- To indicate who is *looking at* a request
- To avoid duplicated effort
- To provide auditability of attention

However, assignment must not be conflated with:
- Authority
- Responsibility
- Adjudication
- Truth validation

This ADR formalizes **reviewer assignment as non-binding coordination metadata**.

## Decision

The system SHALL support reviewer assignment as a **non-authoritative, non-truth-affecting construct**.

Reviewer assignment:
- Links a `ReviewRequest` to a `User`
- Does not imply acceptance, responsibility, or correctness
- Does not mutate claim lifecycle, status, or confidence
- Exists solely to coordinate attention

## Semantics

### What Assignment Means

- “This reviewer has been assigned to look at this request.”
- “Attention has been directed.”

### What Assignment Does NOT Mean

Assignment MUST NOT imply:
- Claim acceptance or rejection
- Reviewer endorsement
- Reviewer obligation
- Reviewer expertise
- Claim correctness
- Claim priority

## Data Model (Conceptual)

A `ReviewAssignment` references:
- `reviewRequestId`
- `reviewerUserId`
- `assignedByUserId`
- `assignedAt`

Assignments are:
- Explicit
- Auditable
- Reversible (future ADR)
- Non-exclusive (future ADR may allow multiple)

## Permissions

- Assignment MAY be restricted by role (e.g., admin, coordinator)
- Reviewers MAY see assignments without accepting them
- Reviewers MAY ignore assignments without penalty

## UI Requirements

- Assignment UI MUST include explicit non-authority language:
  “Assignment coordinates attention only. It does not change truth or claim status.”
- Assigned reviewers MUST be visibly labeled as “Assigned (coordination only)”
- No UI affordance may imply responsibility or obligation

## Non-Goals

This ADR explicitly excludes:
- Automatic assignment
- Reviewer scoring or ranking
- Expertise inference
- SLA or deadlines
- Escalation logic
- Truth signaling

## Testing Implications

- Tests MUST assert that:
  - Claim lifecycle does not change on assignment
  - Adjudication mutations are not triggered
  - Confidence fields are not queried
- MSW guards MUST fail fast on violations

## Consequences

### Positive
- Clear separation of coordination vs authority
- Scalable review workflows
- Strong epistemic safety guarantees

### Negative
- Additional complexity without immediate adjudication benefit
- Requires careful UI language discipline

## Decision Outcome

Reviewer assignment is adopted as **coordination metadata only**, with explicit non-authority guarantees.
