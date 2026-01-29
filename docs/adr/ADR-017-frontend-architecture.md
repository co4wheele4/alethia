# ADR-017: Review Visibility & Audit Semantics

## Status
Proposed

## Date
2026-01-29

## Context

With ADR-012 through ADR-016, Aletheia now supports a complete, persisted
**review coordination layer**:
- Review requests
- Reviewer queues
- Reviewer assignments
- Reviewer responses (acknowledge / decline)

All of these are explicitly **non-authoritative** and do not mutate claim
truth, confidence, or lifecycle.

However, this coordination activity is currently fragmented across routes
and contexts. Users (claim authors, reviewers, admins) lack a coherent,
read-only view of:
- Whether review has been requested
- Who has been assigned
- Whether reviewers have responded

Without visibility, coordination signals lose explanatory power and
auditability, even if they remain epistemically safe.

## Decision

Introduce **read-only visibility surfaces** that expose review coordination
activity **without introducing new semantics or mutations**.

This ADR governs **how review activity is displayed**, not how it is
interpreted or acted upon.

## Principles

Review visibility MUST:
- Be strictly read-only
- Preserve non-authority semantics
- Avoid implication of correctness, endorsement, or acceptance
- Never affect claim lifecycle, confidence, or adjudication eligibility

## In Scope

### Visible Coordination Signals

The UI MAY display the following, using existing persisted data only:

- Review request count and sources
- Assigned reviewers (names / identifiers)
- Reviewer responses (ACKNOWLEDGED / DECLINED)
- Timestamps for request, assignment, and response

### Visibility Surfaces

1. **Claim Review Page**
   - “Review Activity” panel (collapsed by default)
   - Displays coordination timeline
   - No controls or actions

2. **Claim Comparison View**
   - Inline indicator when claims under comparison have active review requests
   - Tooltip or drawer for details (read-only)

3. **Reviewer Queue**
   - Already displays coordination data; must remain non-authoritative

### Required Copy (Non-Authority Disclaimer)

Every visibility surface MUST display or include access to the message:

> “Review activity records coordination only.  
> It does not determine truth, correctness, or claim status.”

## Explicitly Out of Scope

The following are NOT allowed under this ADR:

- Any mutation or state change
- “Reviewed”, “Completed”, or “Consensus” indicators
- Claim lifecycle or confidence changes
- Aggregate “trust”, “reliability”, or “review score” signals
- Automation based on review visibility

## Access Rules

- Claim authors MAY view review activity on their own claims
- Assigned reviewers MAY view their assignments and responses
- Admins MAY view aggregate coordination data
- No public or unauthenticated access

## API Constraints

- Existing GraphQL schema MUST be reused
- No new mutations introduced
- New queries or fields are allowed ONLY if:
  - They are read-only
  - They expose no new semantics beyond persisted coordination data

## Testing Requirements

- UI tests assert visibility only
- Playwright tests assert:
  - No mutations fired
  - Claim.status unchanged
  - adjudicateClaim never invoked
- MSW guards must fail if:
  - Any lifecycle or adjudication mutation is attempted
  - Confidence/probability fields are queried

## Consequences

### Positive
- Improved explainability and trust
- Easier debugging and auditing
- No epistemic risk introduced

### Negative
- Increased UI complexity
- Requires careful copy discipline to avoid misinterpretation

## Decision Outcome

Approved for implementation as a visibility-only feature.
