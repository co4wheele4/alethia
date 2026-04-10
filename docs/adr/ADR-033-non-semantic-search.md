# ADR-033: Non-Semantic Search Constraints

## Status

Status: ACCEPTED

## Context

Aletheia must support locating claims and evidence by **structural, deterministic** means only. Search must not introduce relevance scoring, fuzzy similarity, embeddings, clustering, or “best match” semantics.

## Decision

### Allowed

- **Exact** string match (case sensitivity is explicit per request).
- **Prefix** match.
- **Substring** match.
- **Structural filters**: lifecycle, evidence source kind, created-at ranges.
- **Deterministic ordering only**: `createdAt` ascending/descending, `id` ascending/descending.
- **Explicit pagination**: `limit` and `offset` are required on search operations.

### Forbidden

- Fuzzy / typo-tolerant search.
- Embeddings or vector similarity.
- Relevance scoring or ranking by “match quality”.
- “Best match”, “related claims”, “similar evidence”, or clustering APIs.

### API

GraphQL exposes `searchClaims` and `searchEvidence` with inputs that encode match mode, case sensitivity, filters, deterministic `orderBy`, and required `limit`/`offset`. No rank or score fields are exposed.

### Implementation

- SQL uses Prisma string filters (`equals` / `startsWith` / `contains` with explicit case mode). No `ts_rank`, trigram similarity, or ordered full-text ranking.

## Consequences

- Clients must choose ordering explicitly; default ordering is not implied as “better”.
- Search remains auditable: results are subsets of stored rows under explicit predicates.

## References

- ADR-022 (query non-semantic constraint): guard updated to allow `orderBy` only inside `searchClaims` / `searchEvidence` inputs, not arbitrary ranking elsewhere.
