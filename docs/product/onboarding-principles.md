# Onboarding principles — Aletheia

**Goal:** Users understand capabilities and limits **before** they mistake traceability for judgment. **ADR-038** applies.

---

## Must say early

1. **Claims are statements, not facts** — The system stores and links; it does not validate real-world truth automatically.
2. **Evidence is stored as-is** — Rendering is faithful to the record; there is no hidden “quality” score.
3. **Adjudication is explicit** — Terminal outcomes require permitted human action through defined APIs, not inference.
4. **Coordination is non-authoritative** — Review requests do not adjudicate claims.
5. **Search is non-semantic** — Matches are string-based per ADR-033; there is no “smart” ranking of truth.

## Must never imply

- “The system thinks…” / “Aletheia recommends…”
- “Strong / weak evidence” as an automated assessment.
- “Insufficient support” when the real issue is **no evidence linked** or **workflow prerequisites not met**.

## Preferred vocabulary

| Use | Avoid |
| --- | --- |
| Linked evidence | Strong evidence |
| Cannot proceed: no evidence linked | Insufficient support |
| Explicit adjudication required | System cannot determine truth |
| Non-authoritative until evidence is linked | Low confidence |
| Structural / prerequisite | Semantic deficiency |

---

## Where this shows up

- First-run or empty states, claim and evidence headers, disabled primary actions, comparison and review dialogs.
