# Post-MVP roadmap — Aletheia (bounded evolution)

**Purpose:** Plan safe next steps without semantic drift. This document is **not** a commitment to ship every item; it classifies work by governance risk.

**Last updated:** 2026-04-15

---

## 1. Safe near-term work (no new epistemic semantics)

These align with existing ADRs and mechanical enforcement:

- **Visibility and blocked-state UX** — Clearer prerequisite messaging when actions are disabled (ADR-038); no new “why” beyond structural facts.
- **Workflow improvements** — Read-only coordination, assignment, and queue ergonomics **without** turning coordination into authority (ADR-014–017, ADR-030).
- **Observability expansion** — More structural events and filters (ADR-029); dashboards remain non-interpretive.
- **Reproducibility maturity** — Scheduling, visibility, and operator tooling for repro checks (ADR-026); still hash/status structured.
- **Import/export maturity** — Bundle validation UX, operator runbooks, larger bundle stress tests (ADR-031, ADR-037).
- **Performance and scale** — Pagination enforcement, query limits (ADR-034), indexing for string filters, crawl throughput; **no** approximate search or embeddings.
- **Admin and operational tooling** — Integrity reports, export audits, read-only admin views; **no** automated verdicts.

---

## 2. Work that requires a new or amended ADR

Examples (illustrative, not exhaustive):

- Any **new** user-visible field or workflow that could be read as judgment, recommendation strength, or automated resolution.
- **New external interfaces** (file formats, APIs, webhooks) that carry claim or evidence semantics.
- **Material changes** to adjudication rules, quorum, or lifecycle transitions.
- **New categories** of epistemic events if they could encode interpretive conclusions (ADR-029).
- **Relaxing or narrowing** HTML crawl determinism (ADR-032) or ingestion constraints (ADR-024).

If in doubt, treat it as **ADR-required**.

---

## 3. Explicitly forbidden directions (without ADR and architectural reset)

- **Inference** — LLM extraction, embeddings, semantic search, relevance ranking, clustering, automated “conflict detection” as product truth.
- **Confidence / scoring / “support” metrics** for claims or evidence in user-facing or operator-facing **interpretive** form (ADR-006, ADR-022).
- **Hidden authority** — Background processes that change lifecycle or adjudication outside explicit APIs and logs.
- **Semantic shortcuts** in UI copy — “Strong evidence,” “best match,” “most likely,” “AI recommends,” etc.

---

## 4. Recommended buckets (cross-reference)

| Bucket | Safe focus | Stop line |
| --- | --- | --- |
| Visibility / blocked UX | Prerequisites, roles, missing links | No “you don’t have enough evidence” as a judgment |
| Workflows | Assignment, notifications, read-only coordination | Coordination must not adjudicate |
| Observability | Structural events, audit exports | No truth metrics |
| Reproducibility | Job status, failure taxonomy | No auto-fix of content |
| Import/export | Validation, ordering proofs, restore drills | No silent repair of semantic issues |
| Performance | Limits, indexes, batching | No vector indexes for “similarity” |
| Admin / ops | Integrity, RBAC, backup drills | No “health score” for epistemic quality |

---

## 5. “Not allowed without ADR”

- User-facing **summaries** of evidence or claims produced by models.
- **Similarity** or “related” suggestions based on embeddings or NLP.
- **Ranking** of claims or evidence by “importance” or “relevance.”
- **Automated** detection of contradiction as a product feature (see ADR-009 REJECTED).

---

## 6. “Never add” (non-negotiable bar)

- Embeddings and vector similarity APIs for user-facing workflows.
- Confidence scores, Bayesian or heuristic “strength,” relevance tuning.
- Clustering claims or documents by semantic similarity.
- Automated adjudication or “recommended decision” for claims.

---

*This roadmap defers to [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md) and binding ADRs.*
