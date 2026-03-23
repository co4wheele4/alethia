# ADR-023: Adjudication Integrity Hardening

## Status
ACCEPTED

## Date
2026-03-23

---

## Context

Aletheia enforces:

- Explicit adjudication (ADR-011)
- Evidence closure (ADR-018)
- Non-authoritative coordination layers
- Immutable claims and evidence

Adjudication is the **only mechanism** that transitions a claim to:

- ACCEPTED
- REJECTED

This makes adjudication the **highest-risk mutation surface**.

### Threat Vectors

1. **Indirect lifecycle mutation**
   - Updates via non-adjudication resolvers
   - ORM-level updates bypassing GraphQL

2. **Coordination leakage**
   - ReviewAssignment or ReviewerResponse influencing state

3. **Batch or implicit adjudication**
   - Bulk updates
   - Hidden transitions

4. **Evidence bypass**
   - Adjudicating claims without evidence (ADR-018 violation)

---

## Decision

Adjudication MUST be:

- **Explicit** — One mutation, one transition, human-invoked
- **Singular** — No alternative mutation paths for lifecycle
- **Isolated** — No side-effect from coordination layers
- **Evidence-gated** — Claims without evidence cannot be adjudicated (ADR-018)
- **Fully auditable** — Every transition traceable

NO other mechanism may change claim lifecycle.

---

## Rules

### 1. Exclusive Mutation Path

Only allowed mutation:

```graphql
adjudicateClaim(input: AdjudicateClaimInput!): Claim!
```

(or the equivalent scalar-args form: `adjudicateClaim(claimId: ID!, decision: ClaimLifecycleState!, reviewerNote: String): Claim!`)

Any other resolver, batch operation, or data layer update that mutates `Claim.lifecycle` or `Claim.status` is **forbidden**.

### 2. No Coordination Leakage

- `ReviewAssignment` and `ReviewerResponse` are coordination-only (ADR-015, ADR-016)
- They MUST NOT trigger, imply, or batch-adjudicate claims
- Adjudication is invoked explicitly by the reviewer, not by assignment/response

### 3. No Batch or Implicit Adjudication

- No bulk mutations that transition multiple claims
- No background jobs or automation that change lifecycle
- No ORM `updateMany` on lifecycle/status fields

### 4. Evidence Gate

- Before transitioning to ACCEPTED or REJECTED, the claim MUST be evidence-closed (ADR-018)
- The adjudication resolver MUST enforce this check and fail with a clear error if the claim has no evidence

### 5. Auditability

- Every adjudication MUST record:
  - Reviewer identity (authenticated user)
  - Timestamp
  - Previous and new lifecycle state
  - Optional reviewer note

---

## Relationship to Other ADRs

- **ADR-011**: Defines the adjudication API contract; ADR-023 hardens it by forbidding alternative mutation paths
- **ADR-018**: Evidence closure; ADR-023 enforces evidence gate at adjudication time
- **ADR-015 / ADR-016**: Coordination layers; ADR-023 forbids them from influencing lifecycle
- **ADR-022**: Query constraints; ADR-023 constrains mutations symmetrically

---

## Consequences

### Positive

- Single, auditable mutation surface for claim lifecycle
- No accidental or hidden transitions
- Clear separation of coordination from adjudication
- Evidence gate prevents adjudicating unevidenced claims

### Negative

- Requires vigilance when adding new resolvers or ORM usage
- Batch workflows must use explicit per-claim adjudication calls

These tradeoffs are intentional.

---

## Outcome

Adjudication is hardened as the **exclusive**, **evidence-gated**, **auditable** path for claim lifecycle transitions. No other mechanism may change claim lifecycle.
