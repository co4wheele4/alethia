# ADR-038: User Guidance and Blocked State Semantics

## Status

Status: ACCEPTED

## Date

2026-04-19

---

## Context

Aletheia is a **non-inferential** claim-and-evidence system. User-visible language, layout, and interaction patterns are a high-risk surface: copy, ordering, visual emphasis, comparison layouts, and counts can silently turn the UI into an **implicit decision engine**—suggesting truth, strength, preference, or automated resolution without an explicit human adjudication record.

This ADR binds **all user-facing semantics** in product UI (including onboarding, help, empty states, blocked states, lists, comparison views, and dashboards) to the same epistemic constraints as the data and query layers. **Accepted ADRs are the normative source for what user-facing language is permitted**; implementation MUST NOT drift ahead of that governance through informal design choices.

**Adjudication** is explicit and human-only. **Review coordination** (queues, assignments, visibility) is **non-authoritative**: it MUST NOT be framed as verdict, proof, or recommendation.

---

## Decision

### 1. Structural copy only

User-visible text in product routes MUST describe **only**:

- **What records exist** (claims, evidence, documents, adjudication logs, coordination artifacts), as stored.
- **What links exist** (claim–evidence, document–chunk, and other schema-backed relationships), including absence of required links where relevant.
- **What explicit human or policy actions are required** next (for example submit adjudication, satisfy quorum, complete an import step), without prescribing outcome.
- **What structural preconditions are missing** when an action is unavailable (for example no linked evidence, insufficient role, quorum incomplete, invalid import order, workspace isolation).

User-visible text MUST NOT:

- Summarize “what it means” beyond schema-backed fields.
- Imply that the system weighs, ranks, or prefers claims or evidence.
- Describe coordination as proof of correctness or as a substitute for adjudication.

### 2. Blocked states describe prerequisites, not truth deficits

Messages for disabled actions, validation failures, and workflow gates MUST cite **missing structural prerequisites** or **disallowed roles** only (including policy or workspace rules expressed as structural checks).

Those messages MUST NOT describe epistemic or rhetorical failure. Non-exhaustive **forbidden** formulations include:

- “insufficient support,” “weak case,” “low confidence,” “likely false,” “not enough evidence strength,” or any synonym that suggests evidentiary weight or persuasiveness.
- Language that attributes unavailability to **truth quality** rather than to **unmet structural rules**.

### 3. No implied truth, confidence, relevance, or evidence quality

The UI MUST NOT present or suggest:

- Rankings, scores, grades, confidence, relevance, similarity, clustering, weighting, or any derived “match quality.”
- Superlatives or comparatives that imply evidentiary or argumentative strength (“best,” “strongest,” “most relevant,” “top,” and similar).
- **Automated conflict resolution** or automated agreement/disagreement detection as a user-facing conclusion.

The UI MAY display **human-recorded outcomes** and **schema-backed lifecycle** exactly as stored; those displays MUST NOT be embellished with interpretive framing that implies independent system judgment.

### 4. Ordering must be explicit and non-semantic

Any **ordering or grouping** of claims, evidence, or related records in the UI MUST:

- Be **explicitly labeled** with the structural field or rule determining order (for example “Created at (newest first),” “Identifier,” lifecycle state bucket).
- Use **structural fields or deterministic identifiers only**—never derived scores or “default importance.”

The UI MUST NOT:

- Use **default ordering by count** of linked evidence items (or similar tallies) in a way that suggests importance, strength, or likelihood of truth.
- Use grouping, sections, or visual hierarchy that **implies priority, correctness, or evidentiary quality**.
- Present any ordering that can **reasonably be read as a recommendation** of what to review or believe first.

(Search and list APIs remain subject to **ADR-033**: deterministic `orderBy` only; no relevance ranking.)

### 5. Visual presentation must remain non-semantic

Color, typography weight, size, layout position, badges, icons, charts, and any other **visual prominence** MUST NOT encode:

- Correctness, strength, confidence, priority, or “winning” side.

Visual distinctions are permitted **only** for **structural state** (for example lifecycle phase, read-only vs editable, success/failure of a **mechanical** operation such as save or network error, or accessibility-required focus). Such distinctions MUST be **labeled in structural terms** where ambiguity could imply judgment, and MUST NOT double as proxies for evidence quality.

### 6. Comparison surfaces must remain structural

Comparison views (for example claim-to-claim layouts) MUST:

- Present records **side by side** (or in parallel columns/sections) as **inspectable structure**, without interpretive synthesis.
- Avoid **preference or evaluation** language (“better,” “stronger,” “more consistent,” “winner,” “aligns,” “conflicts with” as system assertions).
- Avoid **aggregation or summary of differences** that substitutes for the user reading the underlying records and links.

Comparison views MUST NOT imply that one claim or evidence set is **better**, **more correct**, or **more supported** than another. Any human adjudication outcome MUST appear only as **explicit stored adjudication data**, not as UI inference.

### 7. Counts must not imply strength

Counts (for example number of linked evidence items, number of reviews) MAY appear **only** as **neutral structural facts**, clearly scoped (what is being counted and over which set).

Counts MUST NOT be:

- Framed as support level, weight, or proof.
- Placed or emphasized such that they **stand in for** qualitative judgment or “how good” the case is.

### 8. Onboarding and help must state system limits

Onboarding flows, global help, in-product education, and persistent banners that describe what Aletheia **does** MUST include **explicit** statements that Aletheia:

- Does **not** infer truth.
- Does **not** score or rank evidence by quality or relevance.
- Does **not** replace **explicit human adjudication** where outcomes are required.

Those statements MUST remain **accurate under this ADR** and MUST NOT be contradicted elsewhere in the same surfaces.

### 9. Hard merge block for semantic guidance changes

Any **proposed UI change** (copy, layout, interaction, default ordering, visual treatment, comparison behavior, or new counters) that could **reasonably be interpreted** as introducing **judgment**, **prioritization** by merit, or **automated reasoning** about claims or evidence MUST **not be merged** until reviewed and accepted under an **ADR** (new ADR or explicit amendment). Mechanical refactors that preserve semantics are out of scope of this gate; **semantic** changes are in scope.

Pull requests MUST NOT treat guardrail fixes or test updates as a substitute for ADR review when the user-visible meaning of the product changes.

---

## Rules and enforcement expectations

| Layer | Expectation |
| --- | --- |
| **PR diff** | `tools/pr-checks/epistemicGuard.cjs` scans product-path diffs for forbidden derived-semantics terms and patterns; violations fail the check. References to this ADR or other allowed guard strings MUST NOT be used to bypass substantive review when semantics change (see §9). |
| **E2E** | Playwright tests (for example `aletheia-frontend/e2e/adr-038-user-guidance.spec.ts`) MUST assert required structural disclaimers and absence of forbidden marketing or ranking language on key surfaces; expand coverage when new governed routes ship. |
| **Docs** | Canonical UX and copy patterns under `docs/product/` MUST stay aligned with this ADR; product docs MUST NOT prescribe judgment-laden or inferential wording. |
| **Design / visual semantics** | Design reviews MUST treat palette, hierarchy, and component choice as subject to §5; no “winning” or “confidence” visual language. |
| **Comparison surfaces** | Changes to compare views MUST be reviewed against §6 in the same manner as copy changes. |

**Governance expectation:** **Accepted ADRs control user-facing semantics.** Implementation, design, and documentation MUST converge to those ADRs; localized product decisions MUST NOT introduce inferential meaning that ADRs forbid.

---

## Relationship to other ADRs

- **ADR-005 (GraphQL contract and data guarantees)** — The UI MUST remain schema-faithful; no invented fields, confidence, or simulated adjudication. Lifecycle and review metadata are **records of process**, not measures of truth.
- **ADR-018 (claim–evidence closure)** — Claims without required evidence remain **non-authoritative** where workflows require closure; blocked states cite **closure prerequisites**, not “lack of proof.”
- **ADR-022 (query non-semantic constraint)** — The UI MUST NOT recreate forbidden query semantics (ranking, derived fields, meaningful aggregation) in presentation or client-side logic.
- **ADR-025 (agent role restrictions)** — Automation (including agents) MUST NOT produce interpretive or comparative conclusions; UI copy MUST not suggest otherwise.
- **ADR-029 (epistemic observability)** — Operational and audit telemetry MUST NOT be surfaced as product “truth scoring”; dashboards remain non-interpretive for epistemic conclusions.
- **ADR-033 (non-semantic search)** — Search UI MUST reflect deterministic structural search only; no “best match” or relevance framing.

---

## Consequences

### Positive

- Reduces the risk that users treat Aletheia as an automated arbiter or recommender.
- Makes drift through polish, ordering, and visuals **explicitly governable**.

### Negative

- Copy and design iteration require discipline; blocked states must name **structural** reasons explicitly.
- Some convenient UX patterns (implicit sort by “activity,” visual “highlights” for evidence) are disallowed when they imply merit.

---

## Compliance and enforcement scope

**In scope:** All user-visible product routes and embedded help, including claim review, claim comparison, evidence viewing, search results presentation, review queues and coordination surfaces, adjudication actions, dashboards, disabled controls with helper text, onboarding, and empty states.

**Out of scope:** Purely internal developer tools, non-user-facing test fixtures, and repository documentation **except** `docs/product/` and ADR-governed narrative that is shown to or shapes user-facing text.

**Responsibility:** Authors and reviewers of frontend changes, design specs that ship to product, and product documentation under `docs/product/` MUST verify compliance before merge; the merge block in §9 applies regardless of automated pass/fail on a given line.
