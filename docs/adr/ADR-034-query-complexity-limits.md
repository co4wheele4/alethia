# ADR-034: Query Complexity / Depth Limits

## Status

Status: ACCEPTED

## Context

GraphQL APIs can be abused with deeply nested or overly wide queries. Aletheia requires **operational** protections that do not introduce semantic ranking or inference.

## Decision

1. **Maximum query depth** is enforced via `graphql-depth-limit` (default cap: 14 levels, excluding introspection `__*` fields).
2. **Approximate query cost** is enforced by counting field selections in the document against a fixed budget (default: 900 selections).
3. **List queries** that return unbounded arrays must require explicit **`limit` and `offset`** arguments on core list surfaces (`claims`, `evidence`, `documents`, `claimsByDocument`). Limits are capped (currently 500 rows per request).

## Errors

- `QUERY_DEPTH_EXCEEDED`
- `QUERY_COST_EXCEEDED`
- `INVALID_LIST_PAGINATION`

## Consequences

- Clients must paginate explicitly; the server rejects missing or out-of-range pagination parameters.
- These limits are mechanical safeguards only; they do not imply relevance or quality.

## References

- `aletheia-backend/src/graphql/graphql-validation-rules.ts`
- `aletheia-backend/src/common/list-pagination.ts`
