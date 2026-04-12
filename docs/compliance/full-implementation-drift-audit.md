# Full implementation drift audit (Aletheia)

## 1. Audit metadata

| Field | Value |
| --- | --- |
| **Audit date** | 2026-04-12 |
| **Repository revision** | `f83780fdf2a847c720e8669d419d565cc8621b2f` |
| **Branch** | `adr-025-agent-role-restrictions` |
| **Prior report** | `docs/compliance/compliance-report-2026-04-10.md` (partial; superseded for governance scope by this artifact) |

This audit maps **accepted** ADRs to concrete code paths, tests, and CI, and records drift or gaps. It is a governance artifact, not a product roadmap.

---

## 2. Repository map (source of truth — verified paths)

| Area | Paths |
| --- | --- |
| **ADR corpus + machine index** | `docs/adr/ADR-*.md`, `docs/adr/index.json`, `docs/adr/INDEX.md` |
| **GraphQL schema (generated snapshot)** | `aletheia-backend/src/schema.gql` (generated; checked by `scripts/check-schema-snapshots.cjs`) |
| **Codegen / schema generation** | `aletheia-backend` package scripts (`npm run schema:generate` from repo root) |
| **Resolvers & services** | `aletheia-backend/src/graphql/resolvers/*.ts`, `aletheia-backend/src/**/*.service.ts` |
| **ORM / migrations** | `aletheia-backend/prisma/schema.prisma`, `aletheia-backend/prisma/migrations/` |
| **Search (ADR-033)** | `aletheia-backend/src/graphql/resolvers/search.resolver.ts`, `aletheia-backend/src/common/search/prisma-string-filter.ts`, `aletheia-backend/src/graphql/inputs/search-*.input.ts` |
| **Adjudication (ADR-011/023)** | `aletheia-backend/src/graphql/resolvers/claim-adjudication.resolver.ts`, `claim-adjudication.service.ts` |
| **Ingestion / crawl** | `aletheia-backend/src/ingestion/htmlCrawlRunner.ts`, `aletheia-backend/src/ingestion/*.ts` |
| **Bundles (ADR-031/037)** | `aletheia-backend/src/bundle/aletheia-bundle.service.ts`, `schemas/aletheiaBundle.schema.json` |
| **Auth / GraphQL user context** | `aletheia-backend/src/auth/`, `aletheia-backend/src/graphql/utils/gql-auth-user.ts` |
| **Frontend** | `aletheia-frontend/app/`, `aletheia-frontend/src/` |
| **MSW** | `aletheia-frontend/src/test/msw/`, `aletheia-frontend/e2e/helpers/msw-handlers.ts` |
| **Playwright** | `aletheia-frontend/e2e/`, `aletheia-frontend/playwright.config.ts` |
| **Governance / CI** | `tools/governance-bot/governance-bot.cjs`, `.github/workflows/governance-bot.yml`, `scripts/check-adr-governance.cjs`, `scripts/check-schema-snapshots.cjs` |
| **ADR governance tests** | `tests/adr/adrGovernanceCompliance.test.ts` |

---

## 3. ADR compliance table (ADR-001 — ADR-037)

Statuses are taken from `docs/adr/index.json` (authoritative for automation). Each **ACCEPTED** ADR is required to list at least one enforcement path and one test path in the index; this is now enforced by `tests/adr/adrGovernanceCompliance.test.ts`.

| ADR | Index status | Enforcement summary (non-exhaustive) |
| --- | --- | --- |
| ADR-001 | ACCEPTED | Frontend layout / Next config; governance scripts |
| ADR-002 | ACCEPTED | Tooling in `aletheia-frontend/package.json` |
| ADR-003 | ACCEPTED | Vitest config; governance |
| ADR-004 | ACCEPTED | Schema snapshot + GraphQL contract tests |
| ADR-005 | ACCEPTED | `schema.gql` snapshot, ADR governance test, frontend contract tests |
| ADR-006 | ACCEPTED | No-confidence client + MSW guards |
| ADR-007 | PROPOSED | Documented only |
| ADR-008 | ACCEPTED | Adjudication resolver + DB constraints + e2e |
| ADR-009 | REJECTED | Historical; guards ensure no conflict semantics in API |
| ADR-010 | ACCEPTED | Comparison UI tests + epistemic PR guard |
| ADR-011 | ACCEPTED | Adjudication service + migration `20260409160000_adr027_*` |
| ADR-012 | SUPERSEDED | Supersession chain validated by ADR governance test |
| ADR-013 | SUPERSEDED | Same |
| ADR-014 — ADR-017 | ACCEPTED | Review coordination resolvers/tests + governance |
| ADR-018 | ACCEPTED | Claim resolvers + DB triggers (review/terminal require evidence) |
| ADR-019 | ACCEPTED | Evidence resolver + ingestion scripts |
| ADR-020 | ACCEPTED | Frontend review/evidence tests + epistemic guard |
| ADR-021 | ACCEPTED | Claim graph page + Playwright |
| ADR-022 | ACCEPTED | Schema lint ADR-022, `assertNoDerivedSemantics`, GraphQL lint, e2e |
| ADR-023 | ACCEPTED | Adjudication hashing + migration `20260410140000_adr036_*` |
| ADR-024 | ACCEPTED | Content hash utils + `adr024-evidence-ingestion.cjs` |
| ADR-025 | ACCEPTED | Governance bot, agent schema lint, e2e |
| ADR-026 | ACCEPTED | Evidence repro service + DB migration |
| ADR-027 | ACCEPTED | SQL triggers + `adr027-epistemic-constraints.e2e-spec.ts` |
| ADR-028 | ACCEPTED | Evidence viewer tests |
| ADR-029 | ACCEPTED | Epistemic audit interceptor + unit tests |
| ADR-030 | ACCEPTED | Quorum logic in adjudication resolver + tests |
| ADR-031 | ACCEPTED | JSON schema + bundle service tests |
| ADR-032 | ACCEPTED | `htmlCrawlRunner` + schema lint ADR-032 |
| ADR-033 | ACCEPTED | `prisma-string-filter` (LIKE/equals only; deterministic `orderBy`) + resolver tests + Playwright |
| ADR-034 | ACCEPTED | `graphql-validation-rules`, list pagination guards + tests |
| ADR-035 | ACCEPTED | JWT user scoping (`gql-auth-user`, search visibility) — **see gaps** |
| ADR-036 | ACCEPTED | Adjudication hash chain + integrity service tests |
| ADR-037 | ACCEPTED | Bundle import forbidden-key scan + schema |

---

## 4. Violations by severity

### CRITICAL

None verified for **claim lifecycle**, **evidence immutability**, **non-semantic search**, or **bundle forbidden keys** in the audited paths:

- **Lifecycle:** `claim.update` for status appears only in `claim-adjudication.service.ts` (application path). DB triggers enforce ADR-027 invariants.
- **Evidence updates:** `evidence.update` not used in application resolvers; DB `BEFORE UPDATE` trigger blocks row updates.
- **Search:** `searchClaims` / `searchEvidence` use `prismaStringFilter` + deterministic `orderBy` only (no `ts_rank`, vectors, or trigram rank).

### HIGH

| Item | Detail |
| --- | --- |
| **GraphQL `Embedding` surface** | Schema exposes `Embedding`, `createEmbedding`, `updateEmbedding`, and chunk `embeddings`. **ADR-033 search does not use these.** Risk is **misuse** as a relevance signal outside documented scope. Mitigation: keep search implementation free of embedding imports; governance and schema lints block semantic query fields. |
| **ADR-035 workspace isolation** | Scoping exists (e.g. search visibility via document/user linkage). Full cross-tenant denial matrix is not exhaustively proven in this pass; index maps partial tests. |

### MEDIUM

| Item | Detail |
| --- | --- |
| **`askAI` mutation** | Persists OpenAI embedding API output into `AiQuery` / `AiQueryResult`. This is **not** claim/evidence truth, but it is stored semantic-ish text. Treat as coordination/audit surface; do not promote to adjudication. |
| **Developer docs** | `aletheia-frontend/UI_COMPONENT_MAPPING.md` describes hypothetical “semantic search” and confidence-style components that **do not match** the authoritative contract. **Documentation drift only** — not runtime behavior. |

### LOW

| Item | Detail |
| --- | --- |
| **Comments in `openai.service.ts`** | Previously suggested pgvector-style usage; **replaced** with a neutral note (this audit). |

---

## 5. Files patched (this audit)

| File | Change |
| --- | --- |
| `aletheia-backend/src/openai/openai.service.ts` | Removed misleading pgvector/semantic-search comment; clarified audit-only intent of returned payload. |
| `aletheia-backend/src/graphql/resolvers/app.resolver.ts` | Removed stray implementation comment on `getEmbeddingResult`. |
| `tests/adr/adrGovernanceCompliance.test.ts` | **ACCEPTED** ADRs must have non-empty `enforcement` and `tests` in `docs/adr/index.json`. |

---

## 6. Tests added or updated

| Test | Role |
| --- | --- |
| `tests/adr/adrGovernanceCompliance.test.ts` | Ensures every **ACCEPTED** ADR in `index.json` lists enforcement and test artifacts. |

**Commands run successfully for this audit**

- `npm run test:adr-governance`
- `npm run test:guardrails`
- `npm run schema:check` (ADR-022/023/024/025/032 lints + schema snapshot consistency)

---

## 7. Remaining gaps (tracked)

1. **Embedding API:** If policy requires **zero** numeric embedding vectors in the public GraphQL API, a follow-up change would deprecate or gate `Embedding` mutations and fields (large breaking change; not done here).
2. **ADR-035:** Strengthen integration tests for cross-workspace denial on all mutable and export/import paths if not already covered end-to-end.
3. **Documentation:** Align or archive `UI_COMPONENT_MAPPING.md` so it cannot be mistaken for the shipped epistemic contract.

---

## 8. Epistemic drift after remediation

- **Claim–evidence and adjudication paths** reviewed against ADR-018/011/023/027: **no drift detected** in the audited resolver and DB trigger behavior.
- **Search path (ADR-033):** **no semantic ranking** detected; ordering is structural only.
- **Residual drift risk:** **Embedding** GraphQL types and **AI** query logging remain **non-authoritative** surfaces; they must not feed lifecycle or evidence truth.

---

## 9. Go / no-go

| Criterion | Result |
| --- | --- |
| Critical violations (lifecycle bypass, evidence update path, semantic search ranking, forbidden bundle keys) | **None verified** in audited code paths |
| ACCEPTED ADR index enforcement | **Automated** via extended governance test |
| **Decision** | **GO** — acceptable to merge from an epistemic-governance perspective, **provided** the **HIGH** items (embedding surface, ADR-035 depth) are accepted as tracked follow-ups and not mistaken for truth contract. |

If organizational policy interprets **any** GraphQL embedding field as a hard fail regardless of search isolation, status becomes **NO-GO** until that API is removed or strictly gated by ADR revision.
