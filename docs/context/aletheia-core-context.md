# Aletheia Core Context

## Aletheia Frontend Contract (Authoritative)

### Core rule (non-negotiable)

- Do **not** assume backend capabilities beyond the current GraphQL schema (`src/schema.gql`).
- If a field is not present in the schema, it must not appear in:
  - UI
  - GraphQL fragments/queries
  - MSW mocks
  - Tests
  - Comments
  - Placeholder values

### Evidence & provenance guarantees (you MAY rely on these)

- Document provenance metadata
- Chunk-level attribution
- Mention offsets (`startOffset`, `endOffset`)
- Explicit linkage: Document → Chunk → Mention → Entity (and Relationship evidence when exposed)

### Confidence handling (explicit prohibition)

- The backend does **not** expose confidence.
- Therefore:
  - Do **not** display confidence
  - Do **not** mock confidence
  - Do **not** add GraphQL fields for confidence
- If a `confidence` field appears in any API response or mock, **fail immediately** and surface an explicit error.

### Design philosophy

- Explainability comes from traceability, not probability.

### Agent role (ADR-025)

- Do not add copy, components, or schema fields that present agent **recommendations**, **verdicts**, or **comparative strength** of claims or evidence.
- Use only mechanical automation (validation, policy checks, audits)—not interpretive agent outputs.
