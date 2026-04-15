# User mental model — Aletheia

**Audience:** Everyone using or explaining the product.  
**Binding context:** [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md), **ADR-038**.

---

## Claims vs facts

- A **claim** in Aletheia is a **recorded statement** in the system. It is not automatically a “fact” or a verified assertion.
- **Correctness** is not computed. What you see is what was entered and linked, plus **explicit** lifecycle outcomes where a human adjudication path applies.

## Evidence vs correctness

- **Evidence** points to stored source material (documents, chunks, spans, URLs per schema). It is **immutable** and shown **as stored** (ADR-020).
- Evidence **supports traceability**, not automatic proof. Misleading or incomplete sources remain visible; the system does not grade them.

## Adjudication

- **Adjudication** is an **explicit** action with auditability (ADR-011, ADR-023). It is the only path that moves a claim into terminal lifecycle states where the schema allows.
- The system does **not** “decide who is right” on its own; it records **explicit** decisions permitted by policy and role.

## Review coordination

- **Review requests and assignments** are for **human coordination** (ADR-014–017). They do not change claim authority by themselves and are not verdicts.

## Blocked states (structural)

- When something is unavailable, the reason is **structural**: missing link, missing role, quorum not met, invalid import order, etc. (ADR-038)
- Blocked states are **not** “you lose” or “insufficient support” in a debating sense.

## What the system never does

- Infer truth, confidence, or relevance rankings.
- Summarize evidence into verdicts.
- Detect “conflicts” as automatic semantic outcomes (comparison UI is side-by-side inspection only; ADR-010).
- Replace explicit governance with background judgment.

---

*Language in the product should match this document: structural, explicit, non-judgmental.*
