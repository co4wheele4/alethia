# ADR-038: User Guidance and Blocked State Semantics

## Status

Status: ACCEPTED

## Date

2026-04-15

---

## Context

Aletheia is intentionally non-inferential. Users can still misunderstand the product if copy implies hidden judgment, “support” for claims, or automatic truth resolution. The UI and onboarding must describe **structure and prerequisites** (what is linked, what is missing, what explicit action applies), not semantic quality or correctness.

This ADR binds user-facing language to the same constraints as ADR-005, ADR-018, ADR-022, ADR-025, and ADR-033.

---

## Decision

1. **Structural copy only** — User-visible text in product routes MUST describe:
   - what records exist (claims, evidence, documents, adjudication logs),
   - what links exist (claim–evidence, document–chunk),
   - what **explicit** human or policy actions are required (adjudication, review coordination),
   - what **preconditions are not met** when an action is disabled (for example no linked evidence, quorum not met).

2. **Blocked states describe prerequisites, not deficits of truth** — Messages for unavailable workflows MUST cite missing structural preconditions (no evidence linked, wrong role, quorum incomplete, import ordering). They MUST NOT describe “insufficient support,” “weak case,” “low confidence,” or similar semantic judgments.

3. **No implied truth, confidence, relevance, or evidence quality** — The UI MUST NOT present rankings, scores, “strength,” “best,” “most relevant,” similarity, clustering, or automated conflict resolution. (See ADR-009 REJECTED for semantic conflict detection.)

4. **Onboarding and help MUST state system limits** — Any onboarding or global banner MUST explicitly say that Aletheia does not infer truth, does not score evidence, and does not replace explicit adjudication.

5. **Changes to user-facing semantic guidance require ADR review** — New product copy that could be read as judgment, recommendation, or automated resolution MUST be reviewed as an ADR or amendment before merge (in addition to mechanical guards).

---

## Rules (enforcement expectations)

| Layer | Expectation |
| --- | --- |
| PR diff | `tools/pr-checks/epistemicGuard.cjs` flags common derived-semantics terms in product code paths. |
| E2E | Playwright specs assert required disclaimers and absence of ranking language on key surfaces (`aletheia-frontend/e2e/`). |
| Docs | Canonical UX patterns live under `docs/product/` and MUST stay aligned with this ADR. |

---

## Relationship to Other ADRs

- **ADR-005 / `docs/context/aletheia-core-context.md`** — Schema-backed UI; no invented fields or confidence.
- **ADR-018** — Claims may exist without resolvable evidence; non-authoritative until evidence-linked where workflows require it.
- **ADR-025** — No agent verdicts or comparative strength in UI.
- **ADR-033** — Search is non-semantic only.
- **ADR-029** — Observability remains structural; operational metrics must not imply truth scoring.

---

## Consequences

### Positive

- Reduces the risk that users treat the system as an automated arbiter of truth.

### Negative

- Copy is more verbose; blocked states must name preconditions explicitly.

---

## Compliance

Product surfaces (non-exhaustive): claim review, claim comparison, evidence viewer, search, review queue, adjudication actions, disabled buttons with helper text.
