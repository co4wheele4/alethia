# MVP Launch Validation — Aletheia

**Validator role:** Cursor agent — Aletheia MVP Launch Validator  
**Validation date:** 2026-04-13  
**Repository:** `c:\dev\alethia` (monorepo)

---

## 1. Summary

| Item | Result |
| --- | --- |
| **Overall verdict (original audit)** | **NO-GO** |
| **Reason (original)** | **CRITICAL** epistemic and data-integrity violations (see historical findings below). |
| **Post-remediation verdict** | **GO** for repository code, schema gates, and **CI** — the **`MVP Release Gate`** workflow runs Postgres, migrations, Playwright install, PR diff guards, and the full `test-all` matrix (see **`docs/compliance/final-mvp-release-readiness.md`**). |
| **Automated tests (original audit)** | **2104 passed**, **0 failed** at validation time; epistemic gates still failed on C1–C4. |

**Blocking issues (summary):**

1. **CRITICAL — Non-negotiable “NO inference”** is violated by shipped GraphQL and backend behavior: OpenAI **embedding** generation exposed via `askAI`, **LLM JSON extraction** via `proposeExtraction` / `OpenAIService.extract`, and first-class **embedding** CRUD/query APIs. These are inference / similarity machinery and NLP extraction over content, not merely non-semantic search or structural adjudication.
2. **CRITICAL — ADR-031 import vs ADR-027** — `importBundle` inserts `claims` before `evidence`, `claimEvidenceLinks`, and `adjudicationLogs`. PostgreSQL triggers in `20260409160000_adr027_epistemic_db_constraints` require evidence (and, for terminal states, an adjudication log row) to exist **when the claim row is inserted/updated**. This ordering makes **realistic bundle restore** (claims not `DRAFT` at insert time) **fail at the database** or forces unsafe workarounds. Unit tests for import use mocked transactions and do not exercise triggers.

---

## 2. ADR compliance status

| Check | Status | Notes |
| --- | --- | --- |
| ADR-001 … ADR-038 files under `docs/adr/` | **PASS** | ADR markdown files through **ADR-038** (user guidance / blocked states). |
| `docs/adr/index.json` lists ADR-001..ADR-038 | **PASS** | Enforced by `scripts/validate-adr-index.cjs` (`npm run adr:index:check` in CI). |
| Normalized statuses; ACCEPTED ↔ SUPERSEDED rules | **PASS** | `tests/adr/adrGovernanceCompliance.test.ts` (included in root `npm test` via `test:adr-governance`). |
| ADR-018 (claims may exist without evidence; no progress without evidence) | **PASS (backend + docs)** | Resolver enforces evidence before adjudication; `Claim` field docs describe non-authoritative empty evidence. |
| ADR-005 alignment with ADR-018 | **PASS** | Schema and filters (`hasEvidence`, lifecycle) reflect closure rules. |
| ADR-009 semantic conflict detection | **N/A (REJECTED)** | Indexed as REJECTED; comparison UI is structural only per docs and tests. |

---

## 3. Violations by severity

### CRITICAL (epistemic invariants / authority / restore integrity)

| ID | Finding | Evidence |
| --- | --- | --- |
| C1 | **Inference / similarity machinery in production API** — `Mutation.askAI` calls `OpenAIService.getEmbeddingResult`, which uses `openai.embeddings.create` (when network enabled) and returns a JSON serialization of the embedding vector. This is **semantic embedding inference**, explicitly excluded from the MVP bar (“NO inference”, “NO embeddings” in the search/inference sense). | `aletheia-backend/src/graphql/resolvers/app.resolver.ts` (`askAI`), `aletheia-backend/src/openai/openai.service.ts` (`getEmbeddingResult`) |
| C2 | **LLM extraction over document text** — `proposeExtraction` uses `OpenAIService.extract` → GPT-4o with `response_format: json_object` to infer entities/relationships. This is **NLP inference**, not structural storage of user-provided evidence. | `aletheia-backend/src/ingestion/extraction.service.ts`, `aletheia-backend/src/openai/openai.service.ts` (`extract`) |
| C3 | **Embedding vectors as first-class GraphQL data** — Schema types `Embedding`, mutations `createEmbedding` / `updateEmbedding` / `deleteEmbedding`, queries `embeddings`, `embeddingsByChunk`, and `DocumentChunk.embeddings` expose **vector representations** suitable for similarity workflows. Even if ADR-033 search is clean, this violates the stated **global** non-negotiable principle as written for this validation. | `aletheia-backend/src/schema.gql` (`Embedding`, `Mutation`, `Query`, `DocumentChunk`) |
| C4 | **Bundle import ordering vs ADR-027 triggers** — `AletheiaBundleService.importBundle` runs `claim.createMany` **before** `evidence.createMany`, `claimEvidenceLink.createMany`, and `adjudicationLog.createMany`. Triggers `enforce_claim_status_epistemic` and evidence immutability require rows to exist in an order this path does not satisfy for non-`DRAFT` claims. **Export/import round-trip and disaster restore** for adjudicated claims are therefore **not safe** at the DB layer. | `aletheia-backend/src/bundle/aletheia-bundle.service.ts` (transaction block); `aletheia-backend/prisma/migrations/20260409160000_adr027_epistemic_db_constraints/migration.sql` |

### HIGH

| ID | Finding | Notes |
| --- | --- | --- |
| H1 | **Governance bot not in the same workflow as all unit/e2e checks** | `.github/workflows/test.yml` runs ADR checks, schema lint, snapshots, and tests. `.github/workflows/governance-bot.yml` runs separately. **Enforcement depends on GitHub branch protection** listing both workflows; otherwise merge bypass is possible. |
| H2 | **User expectation — AI surfaces** | `AnalysisWorkspace` discloses limitations (no citations, scope not enforced). Still **HIGH** risk while `askAi` / `askAI` / extraction remain available without a single global “non-authoritative / not adjudication” banner on every route that surfaces them. |

### MEDIUM

| ID | Finding | Notes |
| --- | --- | --- |
| M1 | **Operational readiness** | Export exists (`exportBundle`). **Restore** is undermined by **C4**. Epistemic audit logging exists (ADR-029). HTML crawl run status and error logs are modeled (`HtmlCrawlIngestionRun.errorLog`, statuses). |
| M2 | **Embedding / AI E2E noise** | Backend E2E logs show expected error paths (e.g. `deleteUser` FK constraints) as console noise — not epistemic failures but noisy ops. |

---

## 4. Files impacted (primary)

| Area | Paths |
| --- | --- |
| ADR docs & index | `docs/adr/*.md`, `docs/adr/INDEX.md`, `docs/adr/index.json` |
| GraphQL contract | `aletheia-backend/src/schema.gql` |
| Adjudication-only lifecycle | `aletheia-backend/src/graphql/resolvers/claim-adjudication.resolver.ts`, `claim-adjudication.service.ts` |
| DB constraints | `aletheia-backend/prisma/migrations/20260409160000_adr027_epistemic_db_constraints/migration.sql` |
| Search (ADR-033) | `aletheia-backend/src/graphql/resolvers/search.resolver.ts`, `aletheia-backend/src/common/search/prisma-string-filter.ts` |
| Bundle import/export | `aletheia-backend/src/bundle/aletheia-bundle.service.ts`, `aletheia-backend/src/graphql/resolvers/aletheia-bundle.resolver.ts` |
| Inference surfaces | `aletheia-backend/src/graphql/resolvers/app.resolver.ts`, `aletheia-backend/src/graphql/resolvers/ai-query.resolver.ts`, `aletheia-backend/src/ingestion/extraction.service.ts`, `aletheia-backend/src/openai/openai.service.ts` |
| CI | `.github/workflows/test.yml`, `.github/workflows/governance-bot.yml` |
| Frontend epistemic UX | `aletheia-frontend/app/features/claims/**`, `claimReview/**`, `claimComparison/**`, `evidence/**`, `analysis/**`, `app/services/apollo-client.ts` |

---

## 5. Fixes applied (if any)

**Original audit:** none.

**Remediation (2026-04-13):** Implemented — inference/embedding/extraction surfaces removed or disabled, bundle import reordered for ADR-027, schema snapshots synced, CI MVP gate workflow and docs added, frontend analysis feature removed with explicit MVP-disabled route. Details: **`docs/compliance/mvp-release-remediation-report.md`**.

---

## 6. Phase notes (condensed)

| Phase | Result |
| --- | --- |
| 0 — Discovery | Repo mapped: ADRs, `schema.gql`, resolvers, Prisma + migrations, ingestion, search, UI, MSW guards, Playwright e2e, CI, governance bot CLI. |
| 1 — ADR compliance | PASS (see §2). |
| 2 — Schema scan | No forbidden *claim/evidence scoring* fields; **Embedding / AI** types present (see C1, C3). Ordering for search uses deterministic enums (`DeterministicOrderBy`). |
| 3 — Backend enforcement | Claim status mutation path is `adjudicateClaim` → `ClaimAdjudicationService`; evidence rows are not updated in application code; triggers block updates. **Exception:** bundle import path (C4). |
| 4 — Database | ADR-027 triggers present and tested in `adr027-epistemic-constraints.e2e-spec.ts`. Import ordering conflicts with triggers (C4). |
| 5 — Evidence integrity | Hashing utilities; repro checks; HTML crawl uses deterministic URL parsing helpers (`htmlCrawlRunner.ts`). |
| 6 — Search | ADR-033: `EXACT` / `PREFIX` / `SUBSTRING` via Prisma string filters; no `ts_rank`, no embedding search in `SearchResolver`. |
| 7 — UI semantics | Largely aligned: explicit “no confidence”, structural “related claims”. Analysis workspace warns about AI limits; global MVP bar still fails on C1–C3. |
| 8 — CI / governance | Strong guardrails in `test.yml`; separate `governance-bot.yml` (H1). |
| 9 — Adjudication | Evidence + quorum (when enabled) + adjudication log in one transaction pattern in `ClaimAdjudicationService`. |
| 10 — User expectations | Good copy on claims/evidence/comparison; AI areas need stricter product-wide policy if C1–C3 remain. |
| 11 — Operations | Export path exists; restore/import blocked by C4; logging/audit present. |

---

## 7. Remaining risks (post-fix)

- **Branch protection:** Require **`mvp-release-gate`** and **`governance-bot`** on the default branch (see **`docs/compliance/mvp-branch-protection.md`**). The separate **`Tests`** workflow is optional overlap (codecov, resolver e2e reminder) if you want redundancy.
- **Feature flags:** If any AI or embedding features are reintroduced, they require an **ADR** and updated schema; MVP schema lint forbids those surfaces in the committed contract.
- **Bundle import:** Real Postgres proof lives in **`aletheia-backend/test/e2e/bundle/bundle-import-adr027.e2e-spec.ts`**, enforced in CI by the MVP Release Gate job (artifact check + migrated DB).

---

## 8. GO / NO-GO decision

| Rule | Application |
| --- | --- |
| **GO** only if **zero CRITICAL** violations | **Original audit:** **Not satisfied** — C1–C4 were CRITICAL → **NO-GO**. |
| **NO-GO** if **any CRITICAL** violation | **Original audit:** **YES — NO-GO.** |

**Post-remediation (see §10):** Codebase and GraphQL contract are **GO** for MVP; **GitHub Actions** should treat **`mvp-release-gate`** as the authoritative full matrix (Postgres-backed backend e2e including bundle import, plus Playwright).

**2026-04-19 follow-up:** `docs/compliance/system-verification-report.md` records **GO** after **`createClaim`** + ADR-035 workspace visibility for draft claims; see **`docs/compliance/final-completion-report.md`**.

**2026-04-20 publisher:** GitHub Actions **SUCCESS** for **`governance-bot`** and **`mvp-release-gate`** on default-branch tip **`c802b51`** (publisher compliance docs; lockfile fix on ancestor **`0f9433f`**); evidence and ruleset gap in **`docs/compliance/final-mvp-release-readiness.md`**. Overall documentation status remains **PROVISIONAL GO** until the default-branch ruleset **requires `mvp-release-gate`** by name.

**Historical verdict: NO-GO** (unchanged as a record of the original audit date).

---

## 9. Checklist (final gate)

| Check | Status |
| --- | --- |
| Run all tests (`npm run test`) | **PASS** at original validation time; re-run after remediation in CI with Postgres |
| CI design (workflows exist) | **PASS** (see H1 for merge-time enforcement) |
| No forbidden schema fields for scoring/ranking in search | **PASS** |
| No lifecycle leaks via normal API | **PASS** (adjudication path); bundle import **PASS** after remediation (ADR-027 ordering + e2e) |
| No semantic search in `searchClaims` / `searchEvidence` | **PASS** |
| UI does not imply truth | **PASS** post-remediation (inference UI removed/disabled per remediation report) |
| **Final launch executor (2026-04-14)** — full local matrix + `mvp-release-gate` + `governance-bot` on PR head **738c86f** | **Mechanical gates: PASS** — see **`docs/compliance/final-mvp-release-readiness.md`** for commands, run URLs, and merge blockers (GitHub Code scanning ruleset). |

---

## 10. Remediation follow-up (2026-04-13)

After engineering remediation, the repository targets **MVP GO** with **zero CRITICAL** violations in shipped schema and default API paths, as documented in **`docs/compliance/mvp-release-remediation-report.md`**. Required mechanical gates include **`npm run schema:check`**, MVP schema lint, and the **`mvp-release-gate`** workflow; GitHub branch protection must still require these checks.

**Operator responsibilities:** GitHub **branch protection** must list required checks by **job name** (`mvp-release-gate`, `governance-bot`). Local runs without Docker/Postgres may still skip backend e2e; **CI is authoritative** for the full matrix.

### 10.1 Final launch executor (2026-04-14)

- **PR head validated:** `738c86f83caab7944511a82bb6e913302569b0fc` on branch `adr-025-agent-role-restrictions` (PR #5).
- **CI (authoritative):** `mvp-release-gate` and `governance-bot` **SUCCESS** — URLs and evidence in **`docs/compliance/final-mvp-release-readiness.md`**.
- **Merge to `master`:** Blocked by GitHub **ruleset** `protect` (Code scanning + code owner review), not by failing MVP mechanical tests. Resolve or dismiss Code scanning alerts per repository policy, then merge PR #5.

---

*End of report.*
