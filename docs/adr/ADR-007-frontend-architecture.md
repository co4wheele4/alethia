# ADR-007: Claim Semantics vs Evidence Semantics

## Status
Proposed

## Date
2026-01-22

## Context

Aletheia’s mission is *truth disclosure*, not opinion synthesis or belief assertion.

In early designs, there is a risk of conflating:
- **Claims** (assertions expressed in source material)
- **Evidence** (verifiable support for or against claims)
- **Relationships** (structured representations derived from evidence)

Without a strict semantic boundary:
- The UI may imply truth where only assertion exists
- Confidence may be misinterpreted as correctness
- Users may assume system endorsement of claims

This ADR establishes a **hard semantic separation** between *what is claimed* and *what is evidenced*.

---

## Definitions

### Claim

A **Claim** is:
- An assertion made in source material
- Attributed to a speaker, author, or document
- Not inherently true or false
- Potentially contradictory with other claims

Examples:
- “Drug X reduces symptoms of disease Y”
- “Company A caused the outage”
- “Person B was present at the event”

Claims exist **independently of validation**.

---

### Evidence

**Evidence** is:
- Concrete, inspectable support related to a claim
- Anchored to documents, text spans, or data artifacts
- Potentially supporting, refuting, or contextualizing a claim

Evidence does **not assert**; it *grounds*.

---

### Relationship

A **Relationship** is:
- A structured linkage derived from evidence
- Between entities or claims
- Explainable via evidence traversal

Relationships are *products of interpretation*, not raw truth.

---

## Decision

Claims and Evidence are **distinct first-class concepts** with separate semantics, lifecycles, and UI treatment.

The system MUST NEVER:
- Treat claims as facts
- Treat evidence as endorsements
- Collapse claims and evidence into a single model

---

## Required Semantic Guarantees

### Claims

Claims MUST:
- Be explicitly marked as claims
- Be attributable to a source (document, author, speaker)
- Be renderable as *assertions*, not conclusions
- Support multiple, conflicting claims simultaneously

Claims MUST NOT:
- Carry truth labels
- Carry confidence semantics (see ADR-006)
- Be auto-resolved by the system

---

### Evidence

Evidence MUST:
- Be traceable to raw source material
- Be inspectable by the user
- Be linkable to one or more claims
- Be renderable independently of claims

Evidence MAY:
- Support multiple claims
- Contradict claims
- Provide contextual nuance

---

### Claims vs Relationships

Relationships MUST:
- Be explainable via evidence
- Never substitute for claims
- Never imply endorsement

Claims MAY:
- Exist without relationships
- Reference entities without relationships

---

## Frontend Rules

- UI MUST visually distinguish claims from evidence
- Claims MUST be phrased as *asserted statements*
- Evidence MUST be navigable and inspectable
- No UI element may imply that a claim is true

Prohibited UI patterns:
- “Verified claim”
- “Confirmed fact”
- Truth badges or checkmarks on claims

---

## Testing Implications

- Contract tests enforce separate types for claims and evidence
- UI tests ensure claims are labeled as assertions
- E2E tests validate evidence traversal without endorsement language

---

## Relationship to Other ADRs

- **ADR-006: Confidence Semantics**  
  Confidence may apply only after claim semantics are defined.
- **ADR-005: GraphQL Contract & Data Guarantees**  
  Prevents semantic inference beyond schema.
- **ADR-004: Frontend Architecture Overview**  
  Requires evidence-first rendering and user inspection.

---

## Consequences

### Positive
- Prevents epistemic overreach
- Preserves neutrality and trust
- Enables contradictory knowledge representation
- Aligns with scholarly and investigative workflows

### Negative
- More complex mental model
- Slower “answers” compared to opinionated systems

These tradeoffs are intentional.

---

## Decision Outcome

Adopted as a **semantic guardrail**.

Aletheia discloses *what is claimed* and *what supports or challenges it* — never what should be believed.
