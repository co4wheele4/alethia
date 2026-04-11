# ADR-005: GraphQL Contract & Data Guarantees

## Status
Status: ACCEPTED

## Date
2026-01-12

## Supersedes
None

## SupersededBy
None

## Context

Aletheia surfaces **claims, evidence, entities, and relationships** with explicit provenance and traceability.

To preserve epistemic integrity, the frontend must **only rely on what the GraphQL schema explicitly guarantees**. Any inferred semantics—especially around confidence, automated conflict resolution, or review state—introduce unacceptable risk.

This ADR defines **hard frontend guarantees** and explicitly documents **what is *not* guaranteed**.

---

## Governing ADRs

ADR-005 is the **contract anchor** and is governed by:

- **ADR-006** — Confidence Semantics (deferred exposure)
- **ADR-007** — Claim Semantics vs Evidence Semantics
- **ADR-008** — Claim Lifecycle & Review States
- **ADR-009** — **REJECTED** (semantic conflict detection; not normative — see ADR-010 / ADR-021)
- **ADR-010** — Claim Comparison UI Semantics (structural inspection only)
- **ADR-011** — Claim Adjudication API Contract
- **ADR-014** — Review coordination persistence (**normative** for current semantics). **ADR-012** and **ADR-013** are **SUPERSEDED** by ADR-014 and are historical only.

Any frontend behavior violating these ADRs is a defect.

---

## Core Principle

> **The GraphQL schema is the only source of truth.**  
> If a field, enum, or relationship is not present in the schema, the frontend must assume it does **not** exist.

---

## Required Guarantees (Schema-Faithful)

### Documents, Claims, Evidence

The frontend MUST treat **`Document`**, **`Claim`**, and **`Evidence`** shapes as defined by the current GraphQL schema and Prisma models. Do not assume fields exist until they appear in the schema.

### Claims

When present in the schema, `Claim` exposes lifecycle and review metadata as **structural records of process**, not as measures of truth.

The frontend MUST:

- Treat lifecycle transitions as **explicit mutations only** (ADR-011)
- Respect terminal states (`ACCEPTED`, `REJECTED`) as **recorded outcomes**, not inferred correctness
- Never simulate adjudication

Per **ADR-018**, claims **MAY** exist without linked evidence; such claims are **non-authoritative** and must not be advanced through review/adjudication/workflows until evidence-closed.

---

### Evidence

Evidence MUST be:

- Explicit
- Traceable
- Rendered without summarization or interpretation beyond schema fields (ADR-020)

Evidence MAY exist without claims.  
Claims MAY exist without evidence (non-authoritative until evidence-closed per ADR-018).

---

### Confidence (Critical Clarification)

Per **ADR-006**:

- Confidence is **not guaranteed** unless explicitly exposed
- The current schema does **not** expose mention-level or evidence-level confidence for UI inference
- Legacy or ignored confidence fields are **non-contractual**

Therefore:

The frontend MUST NOT:

- Render confidence bars
- Calculate confidence
- Mock confidence in MSW
- Assume confidence semantics

---

## Claims vs Evidence (ADR-007)

- Claims are **immutable statements** (assertions), not facts
- Evidence is **referential material** linked under explicit rules (ADR-019)

The frontend MUST:

- Never treat evidence linkage counts or ordering as measures of claim validity
- Never infer conflict from disagreement alone
- Keep evidence rendering independent of claim lifecycle presentation (ADR-020)

---

## Review & Governance Semantics

### Review coordination (ADR-014)

Persisted review coordination (review requests, reviewer queues, assignments, reviewer responses):

- Review intent is **non-mutating** with respect to claim lifecycle except via **explicit adjudication** (ADR-011)
- Queues and assignments are **logistical constructs**; they MUST NOT imply adjudication, confidence, or verdicts
- Acknowledgements and declines are **coordination signals** only

**Historical note:** ADR-012 and ADR-013 are **SUPERSEDED**; the authoritative persisted model is ADR-014.

---

## Frontend Rules (Hard)

- UI MUST NOT guess missing fields
- Missing schema guarantees MUST block feature completion
- GraphQL fragments MUST be reused consistently
- MSW MUST FAIL if:
  - Confidence appears prematurely
  - Lifecycle mutations are simulated outside real mutations
  - Reviewer queues mutate claims directly

---

## Testing Implications

- Contract tests validate schema parity
- UI tests fail on missing guarantees
- Playwright tests assert persistence only via real mutations

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
