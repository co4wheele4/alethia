# ADR-010: Claim Comparison UI Semantics

## Status
Status: ACCEPTED

## Date
2026-01-23

## Context

Aletheia’s purpose is to surface truth through **explicit evidence**, not inferred conclusions.

As claim volume increases, users need to compare claims to:
- Inspect overlapping evidence
- Identify divergent sources
- Manually assess potential disagreement

Early UI prototypes risked introducing implicit conflict semantics, which would violate:
- ADR-005 (schema guarantees)
- ADR-006 (confidence discipline)
- ADR-007 (claim vs evidence separation)

This ADR defines **strict semantic boundaries** for claim comparison in the UI.

---

## Decision

The Claim Comparison UI is a **neutral, read-only inspection surface**.

Comparison exposes **structure**, not interpretation.

---

## UI Semantics

### What Comparison Means
- Side-by-side presentation of claims
- Parallel rendering of evidence
- Explicit provenance visibility

### What Comparison Does NOT Mean
- Conflict detection
- Agreement inference
- Confidence calculation
- Claim resolution
- Truth arbitration

---

## Evidence Rules

- Evidence MUST be shown exactly as returned by GraphQL
- Mentions MUST include offsets
- Documents MUST be identifiable
- No evidence may appear without a source

---

## Language Constraints

The UI MUST avoid:
- “Contradicts”
- “Agrees with”
- “Disproves”
- “Supports more strongly”

Allowed language:
- “Claim A”
- “Claim B”
- “Evidence”
- “Source document”

---

## Interaction Rules

- Comparison is user-initiated
- No automatic comparisons
- No alerts or badges

---

## Testing Implications

- MSW mocks must NOT include conflict metadata
- Tests must fail if confidence or conflict appears implicitly
- Snapshot tests validate neutral rendering

---

## Consequences

### Positive
- Preserves epistemic integrity
- Prevents premature automation
- Keeps UI aligned with backend guarantees

### Negative
- Requires user interpretation
- Delays automated conflict detection

---

## Relationship to Other ADRs

- Builds on ADR-009 (Comparison vs Conflict)
- Enforces ADR-006 (Confidence Semantics)
- Respects ADR-007 (Claim vs Evidence separation)
- Constrains UI behavior defined in ADR-004

---

## Decision Outcome

Adopted as a required constraint for all claim comparison features.
