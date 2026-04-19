# Blocked state patterns — Aletheia

**ADR-038** — Blocked states cite **missing prerequisites** or **disallowed roles**, not semantic failure.

---

## Principles

1. **Name the blocker** — e.g. “No evidence is linked to this claim,” “Reviewer quorum not met,” “Import rejected: schema validation failed.”
2. **Stay non-judgmental** — Do not describe the user’s position as weak or unsupported; describe what the **system requires** next.
3. **Point to explicit actions** — Link to evidence ingestion, assignment, adjudication, or import fix paths that exist in schema.
4. **Distinguish coordination from adjudication** — “Review requested” ≠ accepted/rejected claim.

---

## Examples

| Situation | Good | Avoid |
| --- | --- | --- |
| No evidence on claim | Comparison unavailable: no linked evidence for this claim. | You need stronger evidence to compare. |
| Quorum incomplete | Adjudication blocked: required reviewer responses are not complete. | Consensus not reached. |
| Import ordering / DB constraint | Import blocked: rows failed epistemic ordering checks (see log). | Data looks inconsistent. |
| Search results many | Narrow using text filters; ordering is deterministic (e.g. created time). | Find the best answer. |

---

## Disabled buttons

- Helper text should repeat **precondition**, not rationale about truth.
- If multiple preconditions fail, show the **first hard gate** the schema enforces (evidence closure, role, quorum).

---

## Enforcement (drift control)

- **PR diff:** `tools/pr-checks/epistemicGuard.cjs` uses `tools/pr-checks/adr038Lexicon.json` together with ADR-022 patterns; extend the lexicon when adding new banned product language.
- **UI:** `aletheia-frontend/e2e/adr-038-user-guidance.spec.ts` and `aletheia-frontend/app/lib/adr038ForbiddenUi.ts` (unit tests) guard primary surfaces.

## Related ADRs

- **ADR-018** — Evidence closure and non-authoritative states.
- **ADR-030** — Quorum gate (non-adjudicative workflow).
