# ADR-004: Frontend Architecture Overview

## Status
Status: ACCEPTED

## Date
2026-01-10  
Updated: 2026-01-22

## Context

Aletheia is a *truth disclosure system*, not an answer engine.

The frontend must:
- Surface **what is claimed**
- Expose **what evidence exists**
- Enable users to inspect provenance and context
- Avoid asserting truth, correctness, or belief

As the product evolved, it became necessary to explicitly distinguish **claims**, **evidence**, and **relationships** at the UI architecture level to prevent semantic collapse and epistemic overreach.

This ADR defines the frontend’s architectural responsibilities and **hard UI boundaries** between claims and evidence.

---

## Architectural Principles

1. **Disclosure over assertion**
2. **Evidence-first navigation**
3. **Schema-faithful rendering**
4. **No inferred truth**
5. **User judgment is primary**

---

## Core Semantic Separation (Hard Rule)

The frontend MUST maintain a strict separation between:

| Concept | UI Meaning |
|------|---------|
| Claim | An assertion made in source material |
| Evidence | Inspectable support related to a claim |
| Relationship | A structured linkage derived from evidence |

The UI MUST NEVER:
- Present claims as facts
- Present evidence as endorsement
- Collapse claims and evidence into a single view model

(See ADR-007.)

---

## UI Responsibility Matrix

### Claims (Assertion Layer)

Claims are rendered as **asserted statements**, not conclusions.

UI rules:
- Always labeled as “Claim”
- Attributed to a source (document, author, speaker)
- Neutral language only
- May coexist with contradictory claims

Prohibited:
- Truth badges
- “Verified” language
- Confidence indicators on claims (see ADR-006)

---

### Evidence (Grounding Layer)

Evidence is rendered as **inspectable grounding material**.

UI rules:
- Direct links to documents and text spans
- Highlighted offsets when applicable
- Navigable from claims and relationships
- Renderable independently of claims

Evidence UI answers:
> “What supports or challenges this claim?”

---

### Relationships (Derived Structure Layer)

Relationships represent **structured interpretations**, not raw truth.

UI rules:
- Always explorable via evidence
- Never displayed as conclusions
- Always explainable (“Why does this relationship exist?”)

Relationships MUST NOT:
- Replace claims
- Imply correctness
- Be shown without evidence traversal

---

## Page-Level Architecture

### Documents View

Responsibilities:
- Show document metadata and provenance
- Allow ingestion, deletion, inspection
- Serve as the primary evidence anchor

Documents are **evidence containers**, not knowledge assertions.

---

### Claims View (if/when present)

Responsibilities:
- Display asserted claims
- Attribute claims to documents or speakers
- Enable navigation to evidence

Claims are never summarized as truths.

---

### Entity & Relationship Views

Responsibilities:
- Show entities and relationships as **derived structures**
- Always link back to evidence
- Allow inspection of mention spans

Entities and relationships are *navigational aids*, not conclusions.

---

## Data Flow Constraints

- GraphQL is the single source of truth (ADR-005)
- Frontend MUST NOT infer:
  - Confidence
  - Provenance
  - Relationship strength
- Missing schema guarantees block UI features

---

## Testing & Enforcement

- Contract tests enforce schema faithfulness
- UI tests ensure claims are labeled as assertions
- MSW mocks must fail on uncontracted fields
- E2E tests validate evidence inspection flows

---

## Relationship to Other ADRs

- **ADR-005**: GraphQL Contract & Data Guarantees  
- **ADR-006**: Confidence Semantics  
- **ADR-007**: Claim Semantics vs Evidence Semantics  

ADR-004 defines how these guarantees are **rendered and enforced** in the UI.

---

## Consequences

### Positive
- Prevents implicit truth claims
- Preserves neutrality and trust
- Enables adversarial and investigative use cases
- Scales to contradictory knowledge

### Negative
- More UI complexity
- Slower “answer-oriented” interactions

These tradeoffs are deliberate and aligned with Aletheia’s purpose.

---

## Decision Outcome

The frontend is a **disclosure interface**, not a judge.

Aletheia shows:
- What is claimed
- What evidence exists
- Where it comes from

It never tells the user what to believe.
