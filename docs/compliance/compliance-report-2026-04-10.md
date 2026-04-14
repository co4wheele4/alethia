# Aletheia Compliance Report

**Date:** 2026-04-10  
**Scope:** Mechanical governance audit and repair (ADR-001 … ADR-037).  
**Role:** Governance auditor — no semantic product features added.

## Summary

This pass focused on **ADR normalization**, **ADR-018 evidence closure vs. API behavior**, **machine-readable ADR index + CI validation**, **tighter ADR-022 schema lint patterns**, **governance bot / CI wiring**, and **documentation alignment** (including **ADR-005** cleanup and **ADR-009** marked **REJECTED** for semantic conflict detection).

## ADR compliance status (001–037)

| ADR | Status in index | Primary enforcement |
| --- | --- | --- |
| ADR-001 | ACCEPTED | Frontend app + governance scripts |
| ADR-002 | ACCEPTED | Tooling + governance scripts |
| ADR-003 | ACCEPTED | Tests + governance scripts |
| ADR-004 | ACCEPTED | GraphQL fragments + contract tests |
| ADR-005 | ACCEPTED | Schema snapshots, MSW guards, authoritative rules |
| ADR-006 | ACCEPTED | Apollo client + no-confidence tests |
| ADR-007 | PROPOSED | Contract tests + ADR check |
| ADR-008 | ACCEPTED | Adjudication resolver + e2e |
| ADR-009 | REJECTED | Schema lint + governance (rejection recorded in ADR text) |
| ADR-010 | ACCEPTED | Claim comparison UI tests + epistemic guard |
| ADR-011 | ACCEPTED | Adjudication service + DB constraints |
| 012 | SUPERSEDED | Archived markdown under `docs/adr/` + index entry |
| 013 | SUPERSEDED | Archived markdown under `docs/adr/` + index entry |
| ADR-014 | PROPOSED | Review assignment resolver + e2e |
| ADR-015 | PROPOSED | Resolver tests |
| ADR-016 | PROPOSED | Resolver tests |
| ADR-017 | PROPOSED | Review activity e2e |
| ADR-018 | ACCEPTED | Claim resolver + adjudication gates + DB migration |
| ADR-019 | ACCEPTED | Prisma + evidence resolver tests |
| ADR-020 | ACCEPTED | UI tests + epistemic guard |
| ADR-021 | ACCEPTED | Claim graph e2e |
| ADR-022 | ACCEPTED | `schema-lint-adr022.cjs`, `assertNoDerivedSemantics`, `tools/schema-lint/noDerivedSemantics.ts`, guardrails |
| ADR-023 | ACCEPTED | Adjudication service + lifecycle lint + hash migration |
| ADR-024 | ACCEPTED | Content hash + ingestion lint + resolver tests |
| ADR-025 | ACCEPTED | Governance bot, agent role guard, schema-lint-adr025 |
| ADR-026 | ACCEPTED | Evidence repro service + migration |
| ADR-027 | ACCEPTED | Epistemic DB migration + e2e DB tests |
| ADR-028 | ACCEPTED | Evidence viewer tests + e2e |
| ADR-029 | ACCEPTED | Observability + resolver tests |
| ADR-030 | ACCEPTED | Quorum status in adjudication resolver |
| ADR-031 | ACCEPTED | Bundle schema + bundle service tests |
| ADR-032 | ACCEPTED | HTML crawl runner + schema-lint-adr032 |
| ADR-033 | ACCEPTED | Search resolver + prisma string filter + e2e |
| ADR-034 | ACCEPTED | GraphQL validation rules + list pagination tests |
| ADR-035 | ACCEPTED | Policy doc + auth/workspace utilities (partial implementation noted in ADR) |
| ADR-036 | ACCEPTED | Integrity service + adjudication hash chain migration |
| ADR-037 | ACCEPTED | Bundle schema + import strictness tests |

## Violations found and fixed (this pass)

1. **ADR-005** contained disallowed contract language (“claims must not exist without evidence”, “evidence expresses support”, mandatory Document/EntityMention enumerations). **Fixed:** Rewritten to align with ADR-018/019/020 and explicit non-inference rules.
2. **ADR-009** described semantic conflict detection and claim–claim relationship labels. **Fixed:** Status set to **REJECTED**; normative comparison is structural only (ADR-010 / ADR-021).
3. **Claim `evidence` / `documents` resolvers** threw when a claim had no evidence, contradicting ADR-018. **Fixed:** Return empty lists; tests updated; GraphQL field descriptions updated.
4. **ADR status strings** were inconsistent (“Implemented”, “Living ADR”, “Draft”, etc.). **Fixed:** Normalized to `ACCEPTED` | `REJECTED` | `SUPERSEDED` | `PROPOSED`; `check-adr-governance.cjs` enforces the set.
5. **ADR index** only covered a subset of ADRs. **Fixed:** Full `docs/adr/index.json` for ADR-001–037 via `scripts/publish-adr-index.cjs`, validated by `scripts/validate-adr-index.cjs` (CI + governance bot + guardrails test).
6. **Superseded ADR reference scanner** flagged legitimate index machinery. **Fixed:** Narrow allowlist for `publish-adr-index.cjs`, `validate-adr-index.cjs`, and `docs/adr/index.json`.

## Tests and commands run (during this change)

- `node scripts/check-adr-governance.cjs`
- `node scripts/validate-adr-index.cjs`
- `npm run test:guardrails` (includes ADR index validation)
- `aletheia-backend`: `npm run schema:lint`
- `aletheia-backend`: `jest src/graphql/resolvers/claim.resolver.spec.ts`

Full monorepo `npm test`, Playwright, and integration suites were **not** re-run to completion in this session; run them before merge if required by your release process.

## Remaining TODOs (explicit)

- **ADR-035:** Full `workspaceId` propagation and RBAC matrix across all resolvers (ADR notes partial implementation).
- **Schema codegen:** `npm run schema:generate` currently fails on a pre-existing `graphql-depth-limit` typing issue; resolve separately so generated `schema.gql` can be produced without manual edits.
- **Embeddings / AI surfaces:** Present in schema for non-search paths; ensure they are never used for ranking, relevance, or ADR-033 search (ongoing hygiene).

## Artifacts delivered

- Normalized ADR markdown (status headers; ADR-005 / ADR-009 / ADR-018 updates).
- `docs/adr/index.json` + `scripts/publish-adr-index.cjs` + `scripts/validate-adr-index.cjs`.
- `tools/schema-lint/noDerivedSemantics.ts` (pattern list aligned with `schema-lint-adr022.cjs`).
- Extended `FORBIDDEN_FIELD_PATTERNS` in `aletheia-backend/scripts/schema-lint-adr022.cjs`.
- CI (`test.yml`) and governance bot invoke ADR index validation.
- Claim resolver / model / schema snapshot text aligned with ADR-018.
