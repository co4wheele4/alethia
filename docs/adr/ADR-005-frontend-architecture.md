# ADR-005: GraphQL Contract & Data Guarantees

## Status
Status: Implemented (Living ADR)

## Date
2026-01-12  
Updated: 2026-01-27

## Context

Aletheia’s core value is *truth disclosure* (aletheia): surfacing **claims, evidence, entities, and relationships** with explicit provenance and traceability.

To preserve epistemic integrity, the frontend must **only rely on what the GraphQL schema explicitly guarantees**. Any inferred semantics—especially around confidence, conflict, or review state—introduce unacceptable risk.

This ADR defines **hard frontend guarantees** and explicitly documents **what is *not* guaranteed**.

---

## Governing ADRs

ADR-005 is the **contract anchor** and is governed by:

- **ADR-006** — Confidence Semantics
- **ADR-007** — Claim Semantics vs Evidence Semantics
- **ADR-008** — Claim Lifecycle & Review States
- **ADR-009** — Claim Comparison & Conflict Detection
- **ADR-010** — Claim Comparison UI Semantics
- **ADR-011** — Claim Adjudication API Contract
- **ADR-012** — Review Request Semantics
- **ADR-013** — Reviewer Queues

Any frontend behavior violating these ADRs is a defect.

---

## Core Principle

> **The GraphQL schema is the only source of truth.**  
> If a field, enum, or relationship is not present in the schema, the frontend must assume it does **not** exist.

---

## Required Guarantees

### Documents

Every `Document` MUST expose:

- `id`
- `title`
- `sourceType`
- `createdAt`
- `status`
- `provenanceSummary`

The frontend MUST NOT infer source type, provenance, or ingestion method.

---

### Claims

Every `Claim` MUST expose (if present in schema):

- `id`
- `text`
- `status` (existing persisted enum)
- `reviewedAt?`
- `reviewedBy?`
- `reviewerNote?`

The frontend MUST:
- Treat lifecycle transitions as **explicit mutations only** (ADR-011)
- Respect terminal states (`ACCEPTED`, `REJECTED`)
- Never simulate adjudication

---

### Evidence

Evidence MUST be:

- Explicit
- Traceable
- Renderable

Every evidence reference MUST resolve to:
- A `Document`
- One or more offset-based mentions

Evidence MAY exist without claims.  
Claims MUST NOT exist without evidence.

---

### Entity Mentions

Every `EntityMention` MUST expose:

- `entityId`
- `documentId`
- `startOffset`
- `endOffset`
- `textSnippet`

Offsets MUST reference original document text.

---

### Confidence (Critical Clarification)

Per **ADR-006**:

- Confidence is **not guaranteed** unless explicitly exposed
- The current schema does **not** expose mention-level or evidence-level confidence
- Prisma “legacy/ignored” confidence fields are **non-contractual**

Therefore:

🚫 The frontend MUST NOT:
- Render confidence bars
- Calculate confidence
- Mock confidence in MSW
- Assume confidence semantics

✅ Confidence may only appear when the schema explicitly adds it.

---

## Claims vs Evidence (ADR-007)

- Claims express *assertions*
- Evidence expresses *support*

The frontend MUST:
- Never conflate evidence strength with claim truth
- Never infer conflict from disagreement alone
- Keep evidence rendering independent of claim lifecycle

---

## Review & Governance Semantics

### Review Requests (ADR-012)

- Review intent is **non-mutating**
- It does not alter claim lifecycle
- It is navigational or contextual only

### Reviewer Queues (ADR-013)

- Reviewer queues are **logistical constructs**
- They do not affect truth, confidence, or lifecycle
- They MAY be stubbed in UI
- They MUST NOT imply adjudication

---

## Frontend Rules (Hard)

- UI MUST NOT guess missing fields
- Missing schema guarantees MUST block feature completion
- GraphQL fragments MUST be reused consistently
- MSW MUST FAIL if:
  - Confidence appears prematurely
  - Lifecycle mutations are simulated
  - Reviewer queues mutate claims

---

## Testing Implications

- Contract tests validate schema parity
- UI tests fail on missing guarantees
- Playwright tests assert:
  - Persistence only via real mutations
  - Explicit blocking when schema is insufficient

---

## Consequences

### Positive
- Epistemic integrity
- Predictable UI behavior
- Strong auditability
- Safe schema evolution

### Negative
- Slower feature velocity
- Requires backend/frontend coordination

These tradeoffs are intentional.

---

## Outcome

ADR-005 is the **binding contract** between frontend and backend.

Any deviation requires:
1. A schema change
2. A new ADR
3. Explicit review
