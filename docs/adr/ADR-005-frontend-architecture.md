# ADR-005: GraphQL Contract & Data Guarantees

## Status
Implemented

## Date
2026-01-12

## Related ADRs
- **ADR-004**: Frontend Architecture Overview
- **ADR-006**: Confidence Semantics
- **ADR-007**: Claim Semantics vs Evidence Semantics

---

## Context

Aletheia’s core value is *truth disclosure* (aletheia): surfacing **claims, entities, relationships, and evidence** with explicit provenance and inspectability.

Early frontend assumptions created risk:
- Claims treated as facts
- Evidence conflated with assertions
- Confidence inferred or fabricated in UI
- GraphQL fragments drifting from backend reality

This ADR formalizes **what the frontend is allowed to assume** about GraphQL responses and how those assumptions differ for **claims vs evidence**.

---

## Decision

The GraphQL API is the **single source of truth**.

The frontend MUST:
- Distinguish **claims** from **evidence**
- Use **schema-faithful GraphQL fragments**
- Respect **confidence semantics as defined in ADR-006**
- Enforce **claim vs evidence boundaries as defined in ADR-007**

If the schema does not expose a field, the frontend MUST behave as if it does not exist.

---

## Required Guarantees

### Documents

Every `Document` MUST expose:

- `id`
- `title`
- `sourceType` (UPLOAD, URL, API, MANUAL, etc.)
- `createdAt`
- `status` (INGESTED, PROCESSING, INDEXED, FAILED)
- `provenanceSummary` (human-readable origin)

The frontend MUST NOT infer source type or provenance from UI flow.

---

## Claims (Assertion Layer)

> Claims represent extracted or user-authored assertions.  
> Claims are **not facts**. They are disputable statements.

### Claim Guarantees

Every `Claim` MUST expose:

- `id`
- `text`
- `sourceDocumentId`
- `createdAt`
- `status` (DRAFT, EXTRACTED, CONFIRMED, DISPUTED)

### Explicit Non-Guarantees (ADR-006)

Claims MUST NOT expose:
- `confidence`
- probabilistic weighting
- inferred truthfulness

The frontend MUST:
- Render claims as assertions
- Clearly label them as “Claim”
- Avoid visual affordances implying factual certainty

### Claim GraphQL Fragments

Claim fragments MUST:
- Contain **only assertion-level fields**
- Never include evidence-level confidence or offsets
- Be reusable without leaking evidence semantics

---

## Evidence (Grounding Layer)

> Evidence grounds claims in observable source material.

### Entity Mentions (Evidence Units)

Every `EntityMention` MUST expose:

- `entityId`
- `documentId`
- `startOffset`
- `endOffset`
- `textSnippet`

Offsets MUST refer to the original document text.

⚠️ **Confidence is NOT guaranteed** on mentions in the current schema  
(see ADR-006). The frontend MUST NOT assume it exists.

---

### Entities

Every `Entity` MUST expose:

- `id`
- `label`
- `type`
- `mentionCount`

`confidenceAggregate` MUST NOT be assumed unless explicitly added to the schema.

---

### Relationships

Every `EntityRelationship` MUST expose:

- `sourceEntityId`
- `targetEntityId`
- `relationshipType`
- `evidence[]`

Each `evidence` entry MUST reference:
- A document
- One or more mention IDs

⚠️ Relationship confidence MUST NOT be assumed unless explicitly present in schema.

---

## Evidence Guarantees

- No relationship exists without evidence
- Evidence MUST be renderable in the UI
- Evidence MUST be traceable back to source text
- Evidence MUST be navigable (offset-based highlighting)

---

## Frontend Rules

### Fragment Discipline

- **Claim fragments** and **Evidence fragments** MUST be separate
- No fragment may mix assertion semantics with grounding semantics
- Shared fragments are allowed **only** for structural identifiers (`id`, `createdAt`)

### UI Rules

- UI MUST NOT guess confidence, provenance, or strength
- UI MUST block features that require missing guarantees
- Evidence inspection MUST be possible wherever claims are shown

### Testing Rules

- GraphQL contract tests validate required fields
- MSW mocks MUST fail if:
  - Confidence appears prematurely
  - Evidence is missing where required
  - Claims expose forbidden fields
- UI tests MUST assert evidence inspectability

---

## Consequences

### Positive
- Clear semantic boundaries
- Reduced hallucinated certainty
- Strong auditability
- ADR-aligned UI behavior

### Negative
- Slower feature rollout without schema changes
- Higher upfront discipline required

---

## Decision Outcome

Adopted as a **hard contract** between frontend and backend.

Any violation MUST be treated as a defect, not a workaround.
