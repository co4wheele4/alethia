# ADR-022: Query Non-Semantic Constraint

## Status
ACCEPTED

## Date
2026-03-22

---

## Context

Aletheia enforces strict epistemic discipline:

- No inference (no scoring, ranking, or derived meaning)
- Claims are not facts
- Evidence does not imply correctness
- Humans perform all adjudication

While the data model and mutations are constrained, the **query layer remains a high-risk surface** for inference creep.

Common failure modes include:

- Ranking (e.g., "most supported claims")
- Derived fields (e.g., "confidence", "score")
- Aggregations implying meaning (e.g., evidence counts used semantically)
- Implicit comparison or grouping
- Graph expansion with inferred relationships

If left unguarded, queries can **reintroduce inference without modifying core models**, violating:

- ADR-018 (Evidence Closure)
- ADR-019 (Evidence Semantics)
- ADR-020 (Evidence Rendering Fidelity)
- ADR-021 (Graph Integrity)

---

## Decision

Queries MUST be **structural, referential, and non-semantic only**.

### Allowed Query Semantics

Queries MAY:

- Retrieve entities by ID
- Filter by:
  - lifecycle state
  - presence of evidence (boolean only)
- Traverse explicit relationships:
  - claim → evidence (via join)
- Return immutable stored data exactly as persisted

---

### Forbidden Query Semantics

The following are **strictly prohibited**:

#### 1. Ranking / Ordering
- Any ordering based on meaning or derived properties

#### 2. Derived Fields
- score
- confidence
- relevance
- rank
- strength
- support level

#### 3. Aggregation with Meaning
- evidence counts used to imply importance
- summaries or rollups

#### 4. Comparison
- claim vs claim evaluation
- "better", "stronger", or "more supported"

#### 5. Inferred Relationships
- relatedClaims
- similarClaims
- clustered/grouped claims

#### 6. Evidence Transformation
- summaries
- highlights
- extracted snippets

---

## Schema Constraints

### Allowed

```graphql
type Query {
  claim(id: ID!): Claim
  claims(filter: ClaimFilter): [Claim!]!

  evidence(id: ID!): Evidence
  evidenceForClaim(claimId: ID!): [Evidence!]!
}
```

### Forbidden

Queries MUST NOT expose:

- Any field from the Forbidden Query Semantics list
- Ordering arguments implying semantic ranking (e.g., `orderBy: relevance`)
- Aggregation fields (e.g., `evidenceCount`, `supportScore`)
- Inferred relationship resolvers (e.g., `similarClaims`, `relatedClaims`)

---

## Relationship to Other ADRs

- **ADR-005**: Schema is the single source of truth; ADR-022 constrains what the schema MAY expose at query level
- **ADR-006**: Confidence is explicitly deferred; ADR-022 forbids it at query layer
- **ADR-018**: Evidence closure governs workflow; ADR-022 constrains how evidence presence is queried (boolean only)
- **ADR-019**: Evidence structure is immutable; ADR-022 forbids evidence transformation in queries
- **ADR-020**: Evidence is rendered faithfully; ADR-022 forbids snippets/highlights/summaries
- **ADR-021**: Graph is read-only and non-inferential; ADR-022 enforces this at the query surface

---

## Consequences

### Positive

- Prevents inference creep through the query layer
- Ensures frontend cannot request derived or semantic data
- Preserves epistemic neutrality end-to-end
- Complements ADR-018/019/020/021 at the API boundary

### Negative

- Limits analytics and dashboards that rely on aggregations
- Prevents "recommended" or "similar" features
- Requires discipline when designing new queries

These tradeoffs are intentional.

---

## Non-Goals

This ADR does NOT:

- Constrain mutation semantics (covered by other ADRs)
- Define resolver implementation details
- Prescribe pagination or sorting by non-semantic fields (e.g., `createdAt`, `id`)

---

## Outcome

Queries are constrained to **structural and referential retrieval only**.

The system exposes:
- Entities by ID
- Filtered lists (lifecycle, evidence presence)
- Explicit claim–evidence joins

The system does NOT expose:
- Ranking
- Derived metrics
- Inferred relationships
- Evidence transformation

Inference remains outside the query boundary.
