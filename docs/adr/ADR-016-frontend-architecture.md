# ADR-016: Reviewer Response Semantics (Acknowledge / Decline)

## Status
Proposed

## Date
2026-01-29

## Context

With ADR-012 (Review Requests) and ADR-015 (Reviewer Assignment), Aletheia now supports
**coordination of attention** without mutating claim truth, confidence, or lifecycle.

However, the system currently lacks a way for reviewers to explicitly respond to an
assignment. This creates ambiguity:
- Is the reviewer aware?
- Have they declined?
- Is the queue stalled or simply unseen?

Crucially, any response mechanism MUST NOT:
- Change claim status
- Imply correctness, endorsement, or authority
- Trigger adjudication or confidence updates

## Decision

Introduce **Reviewer Responses** as a strictly coordination-level signal that allows a
reviewer to explicitly acknowledge or decline a review assignment.

Reviewer responses:
- Are optional
- Are non-authoritative
- Do not imply obligation or expertise
- Do not affect claim lifecycle, truth, or evidence

## Definitions

### ReviewerResponse

A persisted record representing a reviewer’s explicit response to an assignment.

Fields:
- `id`
- `reviewAssignmentId`
- `reviewerUserId`
- `response` (ACKNOWLEDGED | DECLINED)
- `respondedAt`
- `note` (optional, explanatory only)

## Allowed Semantics

- ACKNOWLEDGED: “I have seen this assignment.”
- DECLINED: “I cannot take this assignment.”

## Explicitly Disallowed Semantics

Reviewer responses MUST NOT:
- Change Claim.status
- Affect adjudication eligibility
- Imply endorsement, rejection, or confidence
- Block other reviewers
- Trigger workflow automation

## API Contract (High-Level)

Mutation:
respondToReviewAssignment(
reviewAssignmentId: ID!
response: ReviewerResponseType!
note: String
): ReviewerResponse!

diff
Copy code

Allowed error codes:
- UNAUTHORIZED
- ASSIGNMENT_NOT_FOUND
- NOT_ASSIGNED_REVIEWER
- DUPLICATE_RESPONSE

## Frontend Guarantees

- UI MUST display explicit non-authority copy:
  “Reviewer responses coordinate attention. They do not determine truth or claim status.”
- Responses are immutable once submitted.
- Declining does not remove the assignment automatically.
- No adjudication controls appear in response UI.

## Testing Requirements

- Contract tests assert no lifecycle mutation
- UI tests assert persistence across reload
- MSW guards fail if:
  - adjudicateClaim is called
  - claim lifecycle fields are queried
  - confidence/probability fields appear

## Consequences

### Positive
- Eliminates silent queue ambiguity
- Improves reviewer coordination
- Preserves epistemic safety

### Negative
- Additional schema and UI complexity
- Requires strong guardrails to avoid misuse

## Decision Outcome

Approved for implementation as a coordination-only feature.