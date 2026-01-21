# ADR-005: GraphQL Contract & Data Guarantees

## Status  
**Implemented (Amended for Schema Fidelity)**

## Date  
2026-01-12  
**Amended:** 2026-01-21

---

## Context

Aletheia’s core value is *truth disclosure* (*aletheia*): surfacing claims, entities, and relationships **with explicit provenance and evidence**, and—**in the future**—confidence.

Early frontend assumptions and inferred data behavior create risk:
- UI logic becomes coupled to backend implementation quirks
- Data guarantees are implied rather than explicit
- Testing becomes brittle or misleading

**Important clarification:**  
The current backend GraphQL schema **does not expose confidence fields** on mentions, evidence, or relationships. Prisma explicitly marks mention confidence as legacy / ignored.

This ADR formalizes **what the frontend is allowed to assume today**, while clearly deferring aspirational guarantees.

---

## Decision

The GraphQL API is the **single source of truth**.

The frontend MUST:
- Rely **only** on fields explicitly present in the GraphQL schema
- Treat missing fields as **non-existent**, not optional
- Fail fast if undocumented fields appear in responses or mocks

No frontend feature may assume backend capabilities beyond the schema.

---

## Required Guarantees (Current, Enforced)

### Documents

Every `Document` MUST expose:

- `id`
- `title`
- `sourceType` (UPLOAD, URL, API, MANUAL, etc.)
- `createdAt`

If present in the schema, the following MAY be used:
- `status`
- provenance-related summary fields

The frontend MUST NOT infer source type from file extension, upload flow, or UI context.

---

### Entity Mentions

Every `EntityMention` MUST expose **only schema-defined fields**, which currently include:

- `id`
- `chunkId`
- `startOffset`
- `endOffset`

Offsets MUST refer to the original document text.

> ❌ `confidence` is **not available**  
> ❌ `textSnippet` must be derived client-side from offsets and chunk text

---

### Entities

Every `Entity` MUST expose:

- `id`
- `label`
- `type`

Derived values such as mention counts MAY be computed client-side.

> ❌ No aggregate confidence is available or permitted

---

### Relationships

Every `EntityRelationship` MUST expose (if present in schema):

- `id`
- `sourceEntityId`
- `targetEntityId`
- `type`

Relationship evidence MUST be explicit when relationships exist.

> ❌ No relationship confidence is available or permitted

---

### Evidence

Evidence MUST be explicit and traceable via:

- Document
- Chunk
- Offset-based mentions

Evidence MUST be renderable in the UI using:
- Text spans
- Highlighted offsets
- Provenance metadata

---

## Explicitly Deferred Guarantees (Not Implemented)

The following concepts are **intentionally deferred** and MUST NOT be assumed:

- Mention-level confidence
- Relationship confidence
- Evidence confidence
- Aggregate confidence scores

These may be introduced **only** when:
1. The backend schema exposes them explicitly
2. A new ADR amends this contract

---

## Frontend Rules

- UI MUST NOT guess confidence, provenance strength, or relationship certainty
- Explainability MUST be achieved through **traceability**, not probability
- GraphQL fragments MUST remain schema-faithful
- MSW mocks MUST fail if undeclared fields (e.g., `confidence`) appear
- Missing guarantees MUST block feature completion

---

## Testing Implications

- Contract tests validate **absence and presence** of fields
- MSW handlers enforce schema discipline
- UI tests assert provenance and evidence visibility
- Tests MUST fail if confidence appears prematurely

---

## Consequences

### Positive
- Strong schema discipline
- Predictable UI behavior
- High trust through traceability
- Safe forward evolution of confidence features

### Negative
- Some UX affordances deferred
- Requires explicit backend/frontend coordination for schema changes

---

## Decision Outcome

Adopted as a **hard, schema-faithful contract** between frontend and backend.

Confidence is recognized as a **future capability**, not a current guarantee.
