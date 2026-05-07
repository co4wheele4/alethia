# Aletheia — Expert technical & product review

**Original snapshot:** 2026-04-27  
**Last rerun & revision:** 2026-04-28  
**Scope:** Full monorepo (Node/TypeScript, NestJS backend, Next.js/React frontend), ADRs, compliance docs, dependencies, CI/governance, and API documentation surfaces.

**Method:** Reread [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md), [`docs/adr/INDEX.md`](../adr/INDEX.md), `package.json` workspaces, [`docs/architecture/START-HERE-ARCHITECTS.md`](../architecture/START-HERE-ARCHITECTS.md), `npm outdated` (2026-04-28, repo root), backend Jest (`655` unit tests), and `src/schema.gql` spot-checks.

---

## 1. Executive summary

**Aletheia remains aligned with a deliberate, non-inferential model:** explainability through **traceability** (claims, evidence, human adjudication, integrity and audit tooling), not through automated scores, confidence APIs, or semantic “truth” endpoints. The stack (NestJS 11, Apollo Server 5, Prisma 7, PostgreSQL, Next.js 16, React 19, Apollo Client 4, MUI 7, Vitest + Playwright, **@nestjs/swagger** for a small OpenAPI/REST catalog) is **fit for purpose**. Governance is strong: ADR corpus, schema snapshot checks, custom ESLint/GraphQL guardrails, PR epistemic scans, ADR index checks, and governance Jest tests.

**Documentation posture:** Top-level `PROJECT_REVIEW` / `README` metrics drift over time; this file and [`docs/architecture/START-HERE-ARCHITECTS.md`](../architecture/START-HERE-ARCHITECTS.md) are the best **anchors** for “where to read first.” Prefer rerunning this review after major dep or ADR changes.

**Worth to users:** Unchanged in substance—valuable for teams that need **auditable, human-governed** workflows; a poor fit for users who expect default LLM answers or implicit ranking. That tension is **by design** (see ADR-006, ADR-022, ADR-025, ADR-038).

---

## 2. Alignment with ADRs and canonical context

| Area | Assessment (2026-04-28) |
| --- | --- |
| **Core context** | Still encoded in resolvers, UI contracts, tests, and tooling. |
| **ADR-001–003 / `INDEX.md`** | **Addressed** — [`docs/adr/INDEX.md`](../adr/INDEX.md) now lists concrete paths for ADR-001–003 (Next, `package.json`, Vitest, e2e). |
| **ADR-001 “AI-assisted” narrative** | **Addressed** — addendum in [`docs/adr/ADR-001-frontend-architecture.md`](../adr/ADR-001-frontend-architecture.md) defers to ADR-025 and core context. |
| **OpenAPI / REST** | **New external catalog** — not a second truth API: [`aletheia-backend/src/app/openapi.setup.ts`](../../aletheia-backend/src/app/openapi.setup.ts) documents `GET /`, `GET /health` and **points to GraphQL**; Swagger UI at `/api` (see backend README, `ENABLE_SWAGGER` for production). |
| **GraphQL schema** | No `askAI` / `Embedding` string tokens in `aletheia-backend/src/schema.gql` (grep). |
| **Compliance drift audit** | [`docs/compliance/full-implementation-drift-audit.md`](../compliance/full-implementation-drift-audit.md) remains a **time-stamped** artifact; re-read after major **schema, bundle, or admin** surface changes (legacy embedding/AI-query **DB** tables were removed **2026-05-06**). |

---

## 3. Technology stack — currency and fit

### 3.1–3.3 (unchanged summary)

- **Backend:** Nest 11, GraphQL/Apollo 5, Prisma 7, Jest 30, Express 5 — appropriate.
- **Frontend:** Next 16, React 19, AC 4, MUI 7, Tailwind 4, Vitest 4, Playwright — appropriate (ADR-002/004).
- **Monorepo:** npm workspaces, custom eslint plugin, schema/guard scripts — good institutional enforcement.

### 3.4 `npm outdated` snapshot (2026-04-28, root install)

| Observation | Suggested stance |
| --- | --- |
| **Patch/minor** (e.g. Apollo, Prisma 7.7→7.8, `graphql-tools`, `msw`, `react-hook-form`) | Batch upgrades with `npm test`; Dependabot can propose ([`.github/dependabot.yml`](../../.github/dependabot.yml)). |
| **@hookform/resolvers 3.x vs 5.x** | Major jump; align with RHF and project notes in `aletheia-frontend/VERSION_COMPATIBILITY.md`. |
| **MUI 7.x vs 9.x** | Major; schedule with UI QA. |
| **ESLint 9 → 10**, **TypeScript 5.9 → 6** | Separate upgrade tracks. |
| **@types/node 22 vs 25** | Optional after confirming Node 22+ adoption in CI. |

*No longer listed:* a stray **`openai` npm** devDependency in the backend — **removed** (P3 in prior follow-up); optional `OPENAI_API_KEY` in env is documented in backend README for any future, ADR-governed use.

### 3.5 Node version coherence — **resolved**

- **Root / workspaces:** `engines.node` is **`>=20.0.0`**; [`.nvmrc`](../../.nvmrc) = **20**.
- **CI:** [`.github/workflows/test.yml`](../../.github/workflows/test.yml) uses Node 20.
- **Recommendation:** Use Node **20 LTS** locally to match CI and `engines`.

### 3.6 API documentation surfaces (new since prior snapshot)

| Surface | Location | Role |
| --- | --- | --- |
| **GraphQL** | `POST /graphql`, Playground `GET /graphql` in non-production | Primary product API. |
| **OpenAPI 3** | `GET /api` (UI), `GET /api/json`, `GET /api/yaml` | REST catalog + narrative pointer to GraphQL. |

---

## 4. Test inventory (spot-checked 2026-04-28)

| Layer | Count | Note |
| --- | ---: | --- |
| **Backend unit (Jest)** | **655** tests, **65** suites | `npm run test` in `aletheia-backend` (no coverage run for speed). |
| **Backend e2e** | **67** cases in e2e Jest config (last local run: **64 passed**, **3 failed** with DB unique-constraint noise—use **clean** `aletheia_test` / CI for authoritative green). |
| **Frontend** | **1177** unit (Vitest, **193** files) + **50** E2E (Playwright, **22** spec files, Chromium default) — verified 2026-04-28 (`node scripts/run-vitest-inline.mjs run`, `npx playwright test --list`). |

**Suggestion:** In `README` / `PROJECT_REVIEW`, point to `npm run test` / CI for **live** counts, or re-run and update both files on each release (this review cannot guarantee Vitest is green if a spec regresses locally).

---

## 5. Corner cases and ongoing work

1. **ADR-035 (ADMIN / multi-tenant):** Tracked in [`docs/roadmap/post-mvp-roadmap.md`](../roadmap/post-mvp-roadmap.md) §1.1 (product vs deployment-only path).
2. **Doc consolidation:** `CODEBASE_REVIEW_2026.md`, `PROJECT_REVIEW.md`, and this file overlap—optional merge into “stack” vs “product” rolling docs; not blocking.
3. **Major dependency tracks (P6):** MUI 9, TS 6, ESLint 10, `@hookform/resolvers` 5+ — still **separate** PRs with full pipelines.
4. **E2E flakiness:** If unique-constraint failures appear, reset/seed `aletheia_test` and avoid parallel full-suite races against the same DB.

---

## 6. Proposal status (from 2026-04-28 follow-up)

| ID | Item | Status |
| --- | --- | --- |
| P1 | `INDEX.md` for ADR-001–003 | **Done** |
| P2 | Node 20 alignment | **Done** (`.nvmrc`, `engines`, README) |
| P3 | Remove unused `openai` package | **Done** |
| P4 | `PROJECT_REVIEW` comms | **Done** (non-inferential framing) |
| P5 | ADR-035 milestone in roadmap | **Done** (§1.1) |
| P6 | Dep upgrades (majors) | **Partial** — `nanoid` removed from frontend; majors still scheduled |
| P7 | Dependabot | **Done** |
| — | OpenAPI/Swagger | **Done** (`openapi.setup.ts`, `/api`, `/health`) |
| — | `START-HERE-ARCHITECTS` | **Done** |

---

## 7. Will Aletheia help people?

**Unchanged from prior review:** High value for organizations that need **provenance, auditability, and explicit human decisions**; low value if the goal is “AI truth” or opaque ranking. The system’s refusals (no confidence, no interpretive agent verdicts) are a **strength** for governance-heavy use cases, not a gap to paper over without ADR review.

---

## 8. References (non-exhaustive)

- [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md)  
- [`docs/roadmap/post-mvp-roadmap.md`](../roadmap/post-mvp-roadmap.md)  
- [`docs/ALETHEIA_BACKEND_GUARANTEES_V1.md`](../ALETHEIA_BACKEND_GUARANTEES_V1.md)  
- [`docs/adr/INDEX.md`](../adr/INDEX.md), [`index.json`](../adr/index.json)  
- [`docs/architecture/START-HERE-ARCHITECTS.md`](../architecture/START-HERE-ARCHITECTS.md)  
- [`aletheia-backend/README.md`](../../aletheia-backend/README.md) (OpenAPI, GraphQL)  
- [`CODEBASE_REVIEW_2026.md`](../../CODEBASE_REVIEW_2026.md), [`PROJECT_REVIEW.md`](../../PROJECT_REVIEW.md)

---

*Review artifact only—not an ADR. Epistemic or external-behavior changes require ADR process per the roadmap and core context.*
