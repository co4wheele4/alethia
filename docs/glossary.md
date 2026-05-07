# Aletheia glossary

Plain-language definitions for **Aletheia** concepts. This glossary reflects how the product models truth and auditability: **traceability and explicit human decisions**, not automated “truth scores.” For binding technical rules, see [`docs/context/aletheia-core-context.md`](context/aletheia-core-context.md) and the linked ADRs.

---

## How to read this glossary

- **Novice framing:** Think of Aletheia as a **notebook for serious decisions**: “Someone said X,” “Here is the exact source text,” “Here is who reviewed it,” “Here is what we decided”—without the app pretending to *know* whether X is scientifically or legally true.
- **Names vs. everyday words:** Words like *claim* and *evidence* have everyday meanings; here they refer to **specific kinds of records** in Aletheia unless noted otherwise.

---

## A

### Adjudication (claim adjudication)

The **human decision process** around a claim as it moves through review and organizational acceptance or rejection. Adjudication is recorded with **who**, **when**, and **why** (rationale), so decisions can be audited later. The system does **not** replace adjudication with automated verdicts or confidence scores.

_See:_ investor brief (traceability); ADR-011 (API contract).

### Assertion (see **Claim**)

In ordinary speech, an “assertion” is any stated proposition. In Aletheia, modeled assertions that users work with as first-class objects are called **claims**. Material you imported may *contain* assertions by authors (press releases, filings); those become inspectable text first, and **claims** in Aletheia are explicit statements you attach evidence and workflow to.

### Audit / audit trail

The ability to answer **what happened**, **who did it**, and **what was shown** at the time—via persisted records, logs, and integrity mechanisms—not via reconstructed guesses.

---

## C

### Chunk (document chunk)

A **segment of text** cut from a **document** using mechanical rules (for example, paragraph boundaries). Chunks are the usual **unit of evidence anchoring**: mentions and offsets refer into chunk text. Chunks are **not** AI summaries; they preserve source wording.

### Claim

A **claim** is an explicit **statement** captured in Aletheia (for example: “Company A announced Phase 2 results on date D”). In product semantics:

- A claim is **not** automatically “true.”
- It may be **contradicted** by other claims or nuanced by context.
- Its **authority** for workflows comes from **explicit evidence linkage** and **human lifecycle decisions**, not from the system inferring correctness.

Claims have a **lifecycle state** (e.g. draft, reviewed, accepted, rejected). States affect **how the UI treats the claim operationally**; they do **not** introduce probability or confidence.

_See:_ ADR-007 (claim vs evidence), ADR-008 (lifecycle).

### Claim–evidence link

An explicit database association between a **claim** and an **evidence** record. Links make “this claim is grounded here” **inspectable** without merging claim text and evidence into one object.

### Confidence

Aletheia **does not** expose model-level **confidence** or “truth scores” for claims or evidence in the governed API. Explainability is intended to come from **traceability** (sources, spans, decisions), not probability labels.

_See:_ core context; ADR-006.

---

## D

### Derived semantics (forbidden pattern)

Any API or UI behavior that **implies** conclusions not strictly stored—such as “best” evidence, automatic conflict resolution, or ranking by “strength.” Where this would apply, implementations must follow binding constraints or explicitly defer with **`REQUIRES ADR`**.

### Document

A **snapshot of source material** stored in Aletheia (file upload, URL snapshot, etc.), with **metadata** describing provenance (kind of source, labels, timestamps where applicable). Documents are broken into **chunks** for navigation and anchoring.

---

## E

### Entity

A **named thing** the system tracks as a graph object—such as an organization, trial, drug, or product—often discovered or curated in relation to documents. Entities help organize **mentions** and **relationships**; they are **not** automatically “ground truth” about the real world without your governance.

### Entity mention

A record that a specific **entity** appears in a specific **document chunk** at **exact character offsets** (start/end into chunk text). Mentions support **literal highlighting** and audit (“this string is what we anchored”).

### Evidence

**Evidence** is **inspectable support material** tied to sources and locators (document + offsets, URL/HTML snapshots, etc.). Evidence **grounds** discussion; it does **not**, by itself, assert that a **claim** is correct. Evidence records are treated as **immutable** once created; corrections use **new** evidence.

_See:_ ADR-019.

### Evidence closure

The rule that a claim **without** attached evidence is **non-authoritative** for workflow paths that require grounding. Closure is **binary** (evidence attached or not), not graded.

_See:_ ADR-018.

### Extracted assertion

Informal phrase people use for “a proposition pulled out of text or suggested by tooling.” In Aletheia’s **data model**, the comparable **first-class object** is typically a **claim** (once captured) plus optional **AI extraction suggestions** (proposals that are **not** authoritative until accepted through governed workflows). Do not confuse a highlighted span or entity tag with an approved claim.

---

## G

### Grounding / grounded (claim)

A claim is **grounded** when it has **explicit evidence links** that resolve to valid source locators. **Grounding** answers “show me exactly where this comes from,” not “how likely is it true.”

---

## H

### HTML crawl (crawl run)

A **bounded, audited** fetch of web pages according to configured rules (seed URL, depth, domain policy). Crawls produce **evidence** and/or **document** snapshots suitable for provenance; they are not open-ended “scrape the internet” semantics.

_See:_ ADR-032.

---

## I

### Ingestion

The controlled process of bringing **source material** into Aletheia as **documents** (and derived **chunks**), with integrity signals (e.g. hashes) where applicable. Ingestion creates **immutable snapshots**, not silently updating “the same document” when content changes.

### Integrity (tamper-evident)

Mechanisms (e.g. hashes, chains) that help detect **unauthorized alteration** of adjudication or related records. Integrity supports **forensics**, not day-to-day ranking.

_See:_ ADR-036.

---

## L

### Lesson

**Historical (removed 2026-05-06):** Previously a small onboarding-style record (title + content) in the database for demos—not epistemic evidence for claims. The **`lessons`** table and GraphQL surface were **dropped** (migration `20260506120000_remove_lesson_aiquery_embedding`); the term may still appear in old screenshots or audit PDFs.

### Lifecycle (claim lifecycle)

The **state** of a claim in review workflow (e.g. draft → reviewed → accepted/rejected). Lifecycle communicates **process**, not mathematical certainty.

_See:_ ADR-008.

---

## M

### Mention (see **Entity mention**)

---

## N

### Non-inferential

A design stance: the platform **does not** present automated conclusions about truth, relevance strength, or winner/loser between claims beyond **explicit stored facts** and **human adjudication**. Search and queries avoid “smart ranking” that smuggles semantics.

_See:_ ADR-022, ADR-033, ADR-025.

---

## O

### Offset (`startOffset` / `endOffset`)

**Character indices** into **chunk text** that identify a verbatim span (typically **start inclusive**, **end exclusive**). Offsets make excerpts **checkable** against the underlying chunk.

---

## P

### Provenance

**Where information came from** and **how it entered** the system (source type, labels, ingestion time, URLs, file names, etc.). Provenance is declared or mechanical—not inferred “publisher reputation scores.”

---

## R

### Relationship (entity relationship)

A structured link between **entities** (for example, “Organization X **runs** Trial Y”), intended to be **explainable** via **relationship evidence** (anchors into text). Relationships are modeled artifacts; they are not free-form opinions.

### Relationship evidence

Anchored text (chunk + offsets / quoted span) that supports navigating from a **relationship** back to **inspectable source text**.

### Review coordination (review request / assignment / response)

Artifacts for **human review workflows**: asking someone to look at a claim, assigning responsibility, recording acknowledgment or notes. These coordinate people; they do not replace evidence or adjudication records.

_See:_ ADR-014 (persisted review coordination), ADR-015, ADR-016.

---

## S

### Search (claims / evidence)

**Deterministic** lookup: exact / prefix / substring matching and structural filters, with explicit pagination and ordering. There is **no** relevance scoring, embedding similarity, or “best match” API in the governed model.

_See:_ ADR-033.

### Snapshot

An **immutable capture** of source content at a point in time (document text, HTML bytes, etc.). New captures create **new** records rather than silently overwriting history.

### Source (document source)

Structured **metadata** attached to a **document** describing how it was obtained (URL requested/fetched, file name, content type, hashes, etc.).

---

## W

### Workspace isolation

Per-user (or role-governed) boundaries so one user’s documents and claims are **not** exposed to another’s queries—supporting safe multi-tenant use.

_See:_ ADR-035.

---

## Related reading

- [`docs/context/aletheia-core-context.md`](context/aletheia-core-context.md) — binding frontend/API posture (schema fidelity, no confidence).
- [`docs/investors/aletheia-investor-brief.md`](investors/aletheia-investor-brief.md) — product framing for stakeholders.
- [`docs/adr/`](adr/) — architecture decision records for precise semantics.
