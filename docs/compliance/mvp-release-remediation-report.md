# MVP release remediation report

**Date:** 2026-04-13  
**Role:** MVP Release Remediation Engineer (repository changes + validation)  
**Source audit:** `docs/compliance/mvp-launch-validation.md` (original NO-GO)

---

## 1. Original blockers addressed

| ID | Remediation |
| --- | --- |
| **C1** | Removed `Mutation.askAI`, OpenAI embedding usage, and related resolvers/services. MVP schema lint forbids `askAI` / embedding types in `aletheia-backend/scripts/schema-lint-mvp.cjs`. |
| **C2** | Removed `proposeExtraction`, `ExtractionService`, and `OpenAIService.extract` paths from the backend. |
| **C3** | Removed Embedding / AI GraphQL types and CRUD/query fields from the generated schema; `DocumentChunk` no longer exposes embeddings. Root `src/schema.gql` synced with `aletheia-backend/src/schema.gql`. |
| **C4** | `AletheiaBundleService.importBundle` inserts evidence first, claims as DRAFT, links, adjudication logs, then `claim.update` to restore lifecycle (`aletheia-backend/src/bundle/aletheia-bundle.service.ts`). Unit tests cover lifecycle restore and null fields. Integration coverage: `test/e2e/bundle/bundle-import-adr027.e2e-spec.ts` (requires migrated Postgres + valid `DATABASE_URL`). |
| **H1** | Added `.github/workflows/mvp-release-gate.yml` aggregating ADR checks, `schema:check`, lint, guardrails, and full `test-all-with-summary`. Documented required checks in `docs/compliance/mvp-branch-protection.md`. Merge still requires GitHub branch protection to mark these jobs as required. |
| **H2** | Removed `app/features/analysis` (AI UI components/hooks). `/analysis` shows explicit MVP-disabled messaging. Provenance inspector no longer lists an “embedding generation” step; chunking step is API-structural only. Playwright demo walkthrough expects “disabled for MVP”. |

---

## 2. Files touched in this remediation pass (representative)

- **Frontend:** Deleted `aletheia-frontend/app/features/analysis/**`; `app/components/index.ts` (removed analysis exports); `app/components/__tests__/index.test.ts`; `app/features/provenance/components/ProvenanceInspector.tsx`; `e2e/full-demo-walkthrough.spec.ts`; `src/test/msw/handlers/guards.handlers.ts` (`createEvidence` allowlist).
- **Backend:** `src/config/env.validation.spec.ts`; `src/bundle/aletheia-bundle.service.spec.ts` (ADR-027 lifecycle restore coverage).
- **Schema:** `src/schema.gql` (root) aligned with backend snapshot.
- **Docs:** This file; updates to `mvp-launch-validation.md`.

---

## 3. Tests added or updated

- Backend: `env.validation.spec.ts` aligned with optional `OPENAI_API_KEY`; bundle service tests for `claim.update` after import (REVIEWED with fields, ACCEPTED with null review fields).
- Frontend: component index test updated; analysis feature tests removed with feature folder.
- E2E: `full-demo-walkthrough.spec.ts` assertion for `/analysis` MVP disabled copy.

---

## 4. Status vs original findings

| Finding | Status |
| --- | --- |
| C1 | **Resolved** (no embedding / askAI in API or MVP schema) |
| C2 | **Resolved** (no LLM extraction on ingestion path) |
| C3 | **Resolved** (no Embedding CRUD or chunk embeddings in schema) |
| C4 | **Resolved** in application import order + tests; **e2e requires real Postgres** (see §6) |
| H1 | **Resolved** in-repo (authoritative workflow + docs); **branch protection** remains a GitHub UI step |
| H2 | **Resolved** (AI workspace removed/disabled; provenance copy hardened) |

---

## 5. Final GO / NO-GO

**Verdict: GO** for **code and repository gates**, under the strict rule that **zero CRITICAL violations remain in shipped GraphQL and default runtime paths** as verified by schema lint, code search, and unit tests.

**CI caveat:** The authoritative full matrix is **`mvp-release-gate`** (Postgres + Playwright + `test-all`). A **local** run without Postgres may still fail backend e2e during `test-all`; that is an environment limitation, not a missing code fix.

---

## 6. Follow-up (non-blocking for code GO)

- Confirm GitHub **branch protection** requires job names **`mvp-release-gate`** and **`governance-bot`** (see `docs/compliance/mvp-branch-protection.md`).
- **Update (2026-04-13 — release hardening):** The **`MVP Release Gate`** workflow now provisions **Postgres 15**, runs **`npm run test:e2e:setup`**, installs **Playwright** browsers, runs **PR epistemic + agent-role guards**, verifies **GraphQL codegen** matches the snapshot, executes **`scripts/test-all-with-summary.js`** (backend e2e including `bundle-import-adr027`, frontend Playwright), and fails if the bundle-import e2e file is removed (`scripts/check-mvp-bundle-import-e2e.cjs`). **`Governance Bot`** no longer duplicates the full matrix; it runs schema snapshot + mechanical CLI + **`npm run test:guardrails`**.
- Local developers without Postgres still rely on **CI** for the full backend e2e matrix.

## 7. Release hardening pass (2026-04-13)

| Change | Purpose |
| --- | --- |
| `.github/workflows/mvp-release-gate.yml` | Postgres service, `DATABASE_URL`, Playwright install, DB migrate, MVP guards, schema drift check, full test-all |
| `scripts/check-mvp-bundle-import-e2e.cjs` | Fail if ADR-027 bundle import e2e is deleted |
| Root `package.json` `test:e2e:setup` | Aligns with `test.yml` and local docs |
| `.github/workflows/governance-bot.yml` | Avoid duplicate full `npm test`; keep mechanical governance + guardrails |
| Compliance docs + `final-mvp-release-readiness.md` | Single source of truth for GO/NO-GO and required checks |

---

*End of remediation report.*
