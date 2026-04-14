# ADR-037: External Interface Constraints (Import/Export)

## Status

Status: ACCEPTED

## Context

Bundles and external JSON must not become a channel for forbidden semantics (`confidence`, scoring, unknown fields).

## Decision

1. **JSON Schema**: Root `additionalProperties: false` is required (`schemas/aletheiaBundle.schema.json`).
2. **Import**: Reject bundles whose JSON contains forbidden keys (recursive scan for `confidence`, `score`, `rank`, `relevance`, etc.) or version mismatch (`version` must equal `1`).
3. **API boundary**: `importBundle` remains **admin-only** and workspace-scoped when ADR-035 lands.

## Implementation

- Structural validation and forbidden-key rejection live in `aletheia-backend/src/bundle/aletheia-bundle.service.ts` (import path).

## Consequences

- Tightening nested `items` schemas in JSON Schema is a follow-up to reject unknown keys inside array elements.
