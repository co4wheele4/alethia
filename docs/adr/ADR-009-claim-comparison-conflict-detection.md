# ADR-009: Claim Comparison & Conflict Detection

## Status
Status: Proposed

## Date
2026-01-22

## Context

As Aletheia accumulates claims across documents, users must be able to:
- Compare claims that appear to assert the same or related facts
- Identify when claims are consistent, overlapping, or contradictory
- Understand *why* claims conflict, based strictly on evidence

Without a formal model, “conflict detection” risks:
- Implicit truth judgments
- Hidden confidence scoring
- Black-box AI assertions
- UI behavior that oversteps evidence

This ADR defines **how claims may be compared** and **how conflicts are detected and presented**—without violating evidence primacy or confidence constraints.

---

## Decision

Claim comparison and conflict detection are **interpretive overlays**, not truth engines.

Conflicts are *identified*, not *resolved*.
All conflict signals MUST be explainable via evidence.

---

## Definitions

### Claim Comparison
A structured analysis of two or more claims to determine their semantic relationship.

### Conflict
A condition where two claims:
- Refer to overlapping subject matter
- Are supported by evidence that cannot all be simultaneously true

---

## Allowed Claim Relationships

Claim-to-claim relationships MAY include:

- **EQUIVALENT**
  - Same assertion, different wording
- **OVERLAPPING**
  - Share some facts, differ in scope
- **DISJOINT**
  - Unrelated claims
- **CONFLICTING**
  - Cannot both be true given their evidence

These labels are **descriptive**, not evaluative.

---

## Evidence-Grounded Conflict Detection

A conflict MAY be flagged ONLY IF:

1. Claims reference overlapping entities or relationships  
2. Evidence points to mutually exclusive facts  
3. The conflict can be explained by showing:
   - Documents
   - Mentions
   - Relationships

No conflict may be flagged without evidence.

---

## Frontend Semantics

### UI Responsibilities

- Display conflicts as *alerts*, not judgments
- Always provide a “Why is this a conflict?” affordance
- Allow users to inspect both claims side-by-side
- Highlight conflicting evidence inline

### Prohibited UI Behavior

The UI MUST NOT:
- Auto-select a “correct” claim
- Suppress one claim in favor of another
- Assign confidence or likelihood to conflicts
- Merge conflicting claims automatically

---

## Backend & Schema Expectations

If supported by the backend, conflict detection MAY expose:

- claimId
- relatedClaimId
- relationshipType (EQUIVALENT, OVERLAPPING, CONFLICTING)
- evidenceRefs[]

Conflict metadata MUST:
- Be additive (no mutation of claims)
- Be removable without breaking claims

---

## Testing Implications

- UI tests MUST fail if a conflict lacks evidence
- MSW mocks MUST include explicit evidence for conflicts
- Side-by-side comparison views MUST render deterministically

---

## Relationship to Other ADRs

- **ADR-004**: Conflict UI is a higher-level semantic overlay
- **ADR-005**: All data must be schema-faithful
- **ADR-006**: No confidence inference
- **ADR-007**: Claims never replace evidence
- **ADR-008**: Lifecycle state does not resolve conflicts

---

## Consequences

### Positive
- Transparent reasoning
- Auditable disagreement
- Prevents silent contradictions
- Supports expert review workflows

### Negative
- Increased UI complexity
- Requires careful evidence visualization

---

## Decision Outcome

Conflicts are **signals for investigation**, not conclusions.
Truth remains grounded in evidence, not arbitration logic.
