# ADR-028: Evidence UX Navigation Improvements (Non-Semantic)

## Status

Status: ACCEPTED

## Date

2026-04-09

---

## Context

Users need to **inspect** evidence: verbatim text, offsets, source URL, and document chunks, without the product implying automated judgments. Prior surfaces mixed document-centric browsing with claim-context snippets; a dedicated **evidence id** route improves navigation while staying within ADR-005 and ADR-022 constraints.

---

## Decision

The frontend SHALL provide an **Evidence viewer** page at `/evidence/[evidenceId]` that:

- Loads evidence by id via the GraphQL contract (`evidenceById` and related fields).
- Displays snippet and chunk text **verbatim** (ADR-020 alignment), with copy affordances where appropriate.
- May show reproducibility check rows when returned by the API (ADR-026), as read-only audit data.

The UI MUST NOT add confidence, rankings, comparative strength, or agent “verdicts.”

---

## Rules

1. **Schema fidelity** — Only fields present in `src/schema.gql` may appear in UI, fragments, and tests (frontend contract).
2. **Explainability via traceability** — Navigation and display emphasize linkage and source fidelity, not inference.

---

## Implementation (repository)

- Component: `aletheia-frontend/app/features/evidence/components/EvidenceViewer.tsx`
- Route: `aletheia-frontend/app/evidence/[id]/page.tsx`
- Tests: `aletheia-frontend/app/features/evidence/__tests__/EvidenceViewer.test.tsx`, `aletheia-frontend/e2e/evidence-viewer.spec.ts` (when present)

---

## Relationship to Other ADRs

- **ADR-020** — Source-faithful rendering; ADR-028 applies the same principles on the dedicated evidence route.
- **ADR-026** — Reproducibility table is optional child content on the same page.

---

## Consequences

### Positive

- Clear deep links for demos, support, and review workflows.

### Negative

- Another surface to keep aligned with schema evolution; contract tests and snapshots mitigate drift.
