# ADR-031: Export/Import Snapshot Bundles (Structural Integrity)

## Status

Status: ACCEPTED

## Date

2026-04-09

---

## Context

Backups, environment promotion, and forensic copies require moving **structured** claim and evidence data between instances. Such operations must preserve **verbatim integrity** (hashes, stable ids where applicable) and must not introduce semantic interpretation or confidence.

---

## Decision

Aletheia SHALL support **JSON bundles** validated against a published JSON Schema (`schemas/aletheiaBundle.schema.json`).

- **Export** — `exportBundle(input)` returns a JSON document matching the schema, with filters for claims, lifecycle, time ranges, and optional epistemic event inclusion.
- **Import** — `importBundle(input)` is **admin-only**. It validates evidence snippets against stored content hashes; collisions fail unless `allowOverwrite` is explicitly set.

Import/export are **structural portability** tools, not semantic merge or “AI reconciliation.”

---

## Rules

1. **Admin import** — Only privileged roles may import bundles (mutation-level guard).
2. **Hash discipline** — Evidence content in bundles must match `contentSha256` expectations; no silent corruption.
3. **No derived semantics** — Filters and bundle contents exclude interpretive fields not present in the schema contract.

---

## Implementation (repository)

- Schema: `schemas/aletheiaBundle.schema.json`
- Service: `aletheia-backend/src/bundle/aletheia-bundle.service.ts`
- GraphQL: `aletheia-backend/src/graphql/resolvers/aletheia-bundle.resolver.ts` (`exportBundle`, `importBundle`)
- Tests: `aletheia-backend/src/bundle/aletheia-bundle.service.spec.ts`

---

## Relationship to Other ADRs

- **ADR-024** — Content hashing for evidence; ADR-031 carries hashes across environments.
- **ADR-029** — Optional epistemic event slices in exports when explicitly requested.

---

## Consequences

### Positive

- Repeatable, validated snapshots for DR and regulated workflows.

### Negative

- Large bundles and overwrite semantics require careful operational runbooks; import remains a high-privilege operation.
