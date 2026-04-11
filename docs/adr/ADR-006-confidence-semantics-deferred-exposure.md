# ADR-006: Confidence Semantics & Deferred Exposure

## Status
Status: ACCEPTED

## Date
2026-01-22

## Context

Aletheia’s philosophical and product foundation is *aletheia* — truth disclosed without distortion.  
In such a system, **confidence is a powerful but dangerous concept**:

- Exposed too early, it becomes misleading
- Inferred implicitly, it creates false authority
- Inconsistently defined, it erodes trust

The current backend GraphQL schema:
- Does **not** expose confidence on entity mentions or evidence
- Marks mention-level confidence as **legacy / ignored** in Prisma
- Does not yet define a stable semantic model for confidence aggregation

However, early frontend assumptions (now corrected) treated confidence as if it were:
- Guaranteed
- Meaningful
- Uniform across entities, mentions, and relationships

This ADR formally defines **what confidence means**, **when it may be exposed**, and **what the frontend must assume today**.

---

## Decision

### Core Decision

**Confidence is a first-class concept, but it is NOT currently part of the frontend contract.**

Until explicitly exposed by the backend schema:
- Confidence MUST NOT appear in the UI
- Confidence MUST NOT be mocked
- Confidence MUST NOT be inferred
- Confidence MUST NOT be required for feature completeness

The absence of confidence is a **deliberate and enforced state**, not a gap.

---

## Semantic Model (Future, Not Yet Implemented)

When confidence *is* introduced, it MUST adhere to the following semantics.

### 1. Confidence Is Always Contextual

There is no global “confidence.”

Confidence must be scoped to:
- A specific extraction
- A specific model / method
- A specific claim or relationship

Examples:
- Confidence of an entity *mention*
- Confidence of a relationship *given its evidence*
- Confidence of a claim *within a document*

---

### 2. Confidence Is Never Implicit

Confidence MUST be:
- Explicitly computed
- Explicitly versioned
- Explicitly documented

The frontend MUST NEVER:
- Derive confidence from mention count
- Infer confidence from UI prominence
- Assume confidence based on backend behavior

---

### 3. Confidence Is Not Truth

Confidence represents:
> “How strongly the system believes this claim is supported by its evidence,”  
not:
> “Whether the claim is true.”

The UI MUST present confidence (when available) as:
- A system belief signal
- Never as factual certainty
- Never as user instruction

---

## Current Frontend Guarantees (Enforced Today)

Until a future ADR revises this decision:

### Frontend MUST Assume

- ❌ No confidence fields exist in GraphQL
- ❌ No confidence aggregates are stable
- ❌ No confidence is renderable

### Frontend MUST Enforce

- MSW handlers FAIL if confidence appears
- GraphQL fragments MUST exclude confidence
- UI MUST NOT reserve space for confidence
- Tests MUST fail if confidence is introduced unintentionally

Confidence appearing without an ADR revision is a **breaking contract violation**.

---

## Backend Requirements for Future Adoption

Confidence MAY be introduced only if ALL of the following are true:

1. GraphQL schema explicitly exposes confidence fields
2. Confidence fields are documented with:
   - Meaning
   - Scale
   - Source
   - Aggregation rules
3. Confidence versioning is defined
4. Evidence linkage exists for every confidence value
5. A migration path exists for legacy data
6. Frontend ADRs are updated to permit rendering

Until then, confidence remains **intentionally invisible**.

---

## Consequences

### Positive

- Prevents false authority
- Preserves epistemic honesty
- Forces schema discipline
- Keeps UI semantics trustworthy
- Avoids premature product claims

### Negative

- Delays confidence-driven UX
- Requires patience in product storytelling
- Demands stricter backend readiness

These tradeoffs are **intentional and aligned with Aletheia’s mission**.

---

## Relationship to Other ADRs

- **ADR-005**: Defines what the frontend may assume — this ADR explains *why confidence is excluded*
- **ADR-004**: Frontend architecture must surface truth before interpretation
- **ADR-002**: Testing enforces absence of confidence as a contract

---

## Decision Outcome

Confidence is a **deferred, guarded, and explicitly governed concept**.

It will be introduced only when it can be:
- Truthful
- Explainable
- Auditable
- Schema-backed

Until then, silence is the correct implementation.

