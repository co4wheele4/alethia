# ADR-020: Evidence Rendering & Source Fidelity Guarantees

## Status
Status: Accepted

## Date
2026-01-29

---

## Context

ADR-019 defines evidence as a structurally valid, immutable reference to source material.

However, structural validity alone is insufficient.

A system may:
- store correct evidence
- but render it inaccurately
- or present it in a misleading or incomplete way

This introduces a critical risk:

> Evidence may be structurally valid but epistemically misleading at the UI layer.

Aletheia must guarantee that evidence is not only stored correctly, but **rendered faithfully**.

---

## Decision

Introduce **Evidence Rendering Fidelity** as a UI-level invariant.

The system MUST render evidence in a way that:
- preserves original meaning
- preserves context boundaries
- avoids interpretation

---

## Core Invariants

### 1. Source Fidelity

Rendered evidence MUST:
- match the underlying source content
- preserve exact wording (if snippet is used)
- not paraphrase or summarize

---

### 2. Context Reproducibility

Users MUST be able to:
- navigate to the original source
- reproduce the exact referenced segment
- verify the evidence independently

---

### 3. Boundary Integrity

The UI MUST:
- clearly distinguish evidence from claim text
- clearly show where evidence begins and ends
- not blend claim and evidence content

---

### 4. Non-Transformative Rendering

The system MUST NOT:
- summarize evidence
- rank or highlight “important” parts
- reorder evidence based on perceived relevance
- inject interpretation

---

### 5. Explicit Absence Handling

If a claim has no evidence:
- UI MUST explicitly state this
- UI MUST NOT simulate or imply evidence

---

## UI Requirements

Evidence presentation MUST include:
- source reference (document or URL)
- locator context (offsets or anchor)
- verbatim snippet (if available)

Interactions SHOULD include:
- “View in source”
- contextual highlighting

---

## Relationship to Other ADRs

- ADR-018: Only evidence-closed claims are actionable
- ADR-019: Defines structure of evidence
- ADR-010: UI must remain evidence-first and neutral

---

## Non-Goals

This ADR does NOT:
- evaluate evidence quality
- determine correctness
- rank evidence
- infer meaning

---

## Consequences

### Positive
- Prevents misleading evidence display
- Preserves user trust
- Enables independent verification

### Negative
- Increased UI implementation complexity
- Requires precise source anchoring

---

## Outcome

Evidence is not only valid—it is **faithfully rendered**.

Users can:
- see exactly what the evidence is
- verify it independently
- trust that the system has not altered meaning

The system presents evidence.

It does not interpret it.