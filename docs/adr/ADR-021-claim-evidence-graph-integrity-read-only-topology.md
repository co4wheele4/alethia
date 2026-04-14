# ADR-021: Claim–Evidence Graph Integrity & Read-Only Topology

## Status
Status: ACCEPTED

## Date
2026-01-29

---

## Context

Aletheia now enforces:

- Claim non-inference (core principle)
- Evidence closure (ADR-018)
- Evidence structure and immutability (ADR-019)
- Evidence rendering fidelity (ADR-020)

These constraints collectively define a system where:
- Claims are explicit statements
- Evidence is structured, immutable, and traceable
- No inference or scoring exists

At this stage, the system implicitly forms a **graph**:

- Claims connect to evidence
- Evidence may connect to multiple claims
- Review coordination references claims

However, this graph is not yet formally constrained.

This introduces risk:

> The system may begin to treat relationships between claims and evidence as meaningful beyond their explicit definition.

Examples of risk:
- Inferring similarity between claims based on shared evidence
- Deriving "clusters" or "consensus"
- Treating graph structure as epistemic signal

A formal constraint is required to ensure:
- The graph remains **structural**, not **interpretive**

---

## Decision

Define the **Claim–Evidence Graph** as a **read-only, non-inferential topology**.

The graph represents:
- Explicit relationships only
- No derived meaning
- No computed edges

The system MAY expose the graph for inspection, but MUST NOT interpret it.

---

## Definitions

### Claim–Evidence Graph

A directed graph where:

- Nodes:
  - Claims
  - Evidence

- Edges:
  - Claim → Evidence (explicit linkage)

No other edge types are permitted.

---

## Core Invariants

### 1. Explicit Edge Invariant

All edges in the graph MUST be:

- Explicitly created via user or API action
- Represented in the schema (e.g., ClaimEvidence join table)

The system MUST NOT:
- Create inferred edges
- Suggest edges
- Auto-link claims or evidence

---

### 2. Read-Only Topology Invariant

The graph MAY be:

- Queried
- Visualized
- Traversed

The graph MUST NOT be:

- Mutated implicitly
- Rewritten based on heuristics
- Reordered based on interpretation

All mutations must occur through explicit operations (e.g., linking evidence to a claim).

---

### 3. Non-Inference Invariant

The system MUST NOT:

- Infer claim similarity from shared evidence
- Compute clusters, groups, or communities
- Derive consensus or disagreement
- Rank nodes or edges

Graph structure has **no epistemic meaning**.

---

### 4. No Derived Metrics

The system MUST NOT compute:

- Node centrality
- Edge weights
- Graph density
- Influence scores

No metrics may be derived from graph topology.

---

### 5. Evidence Reuse Transparency

If multiple claims share evidence:

- This MUST be visible
- This MUST NOT imply agreement, correctness, or relationship

The system exposes reuse, not meaning.

---

### 6. UI Neutrality

Graph-related UI MUST:

- Display nodes and edges explicitly
- Avoid visual emphasis implying importance
- Avoid clustering or grouping by algorithm

UI MUST NOT:
- Highlight "important" nodes
- Suggest relationships
- Collapse nodes into inferred structures

---

## Allowed Operations

The system MAY:

- Fetch claims and their evidence
- Show shared evidence across claims
- Render a read-only graph visualization
- Provide navigation between linked entities

---

## Disallowed Operations

The system MUST NOT:

- Auto-link claims or evidence
- Suggest relationships
- Compute similarity or conflict
- Introduce inferred edges
- Rank or score graph elements

---

## Relationship to Other ADRs

- ADR-018: Only evidence-closed claims are actionable
- ADR-019: Evidence is structurally valid and immutable
- ADR-020: Evidence is rendered faithfully
- ADR-014: Review coordination does not imply truth

ADR-021 ensures that **relationships between these entities remain non-inferential**.

---

## Non-Goals

This ADR does NOT:

- Provide graph analytics
- Enable recommendation systems
- Detect conflicts or agreement
- Support automated reasoning

---

## Consequences

### Positive

- Prevents semantic drift from structure to meaning
- Enables safe graph visualization
- Preserves epistemic neutrality at scale
- Supports auditability and transparency

### Negative

- Limits advanced graph-based features
- Prevents automated insights
- Requires discipline in UI design

These tradeoffs are intentional.

---

## Outcome

The Claim–Evidence Graph is defined as a **purely structural artifact**.

It enables:
- navigation
- inspection
- transparency

It does NOT enable:
- interpretation
- inference
- decision-making

The system exposes relationships.

It does not assign them meaning.
