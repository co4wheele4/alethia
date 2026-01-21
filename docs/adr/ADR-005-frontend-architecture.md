# ADR-005: GraphQL Contract & Data Guarantees

## Status
Implemented

## Date
2026-01-12

## Context

Aletheia’s core value is *truth disclosure* (aletheia): surfacing claims, entities, and relationships **with explicit provenance, evidence, and confidence**.

Early frontend assumptions and inferred data behavior create risk:
- UI logic becomes coupled to backend implementation quirks
- Confidence and provenance are implied rather than guaranteed
- Testing becomes brittle or misleading

This ADR formalizes **what the frontend is allowed to assume** about GraphQL responses.

## Decision

The GraphQL API MUST expose explicit, stable, and testable contracts for all knowledge-related concepts.

The frontend MUST treat GraphQL as the single source of truth.

## Required Guarantees

### Documents

Every `Document` MUST expose:

- `id`
- `title`
- `sourceType` (UPLOAD, URL, API, MANUAL, etc.)
- `createdAt`
- `status` (INGESTED, PROCESSING, INDEXED, FAILED)
- `provenanceSummary` (human-readable description of origin)

The frontend MUST NOT infer source type from file extension or upload flow.

### Entity Mentions

Every `EntityMention` MUST expose:

- `entityId`
- `documentId`
- `startOffset`
- `endOffset`
- `confidence`
- `textSnippet`

Offsets MUST refer to the original document text.

### Entities

Every `Entity` MUST expose:

- `id`
- `label`
- `type`
- `confidenceAggregate`
- `mentionCount`

### Relationships

Every `EntityRelationship` MUST expose:

- `sourceEntityId`
- `targetEntityId`
- `relationshipType`
- `confidence`
- `evidence[]`

Each `evidence` entry MUST reference:
- A document
- One or more mention IDs

### Evidence

Evidence MUST be explicit and traceable:
- No relationship exists without evidence
- Evidence MUST be renderable in the UI

## Frontend Rules

- UI MUST NOT guess confidence, provenance, or relationship strength
- Missing guarantees MUST block feature completion
- GraphQL fragments MUST be reused consistently
- MSW mocks MUST mirror these guarantees

## Testing Implications

- Contract tests validate required fields
- UI tests fail if guarantees are missing
- E2E tests assert evidence visibility

## Consequences

### Positive
- Predictable UI behavior
- Strong trust semantics
- Easier onboarding and auditing

### Negative
- Requires backend discipline
- Slower schema evolution without coordination

## Decision Outcome

Adopted as a hard contract between frontend and backend.
