# Epistemic stress test plan — Aletheia

**Purpose:** Exercise adversarial and high-friction scenarios so the system does not gain **hidden authority**, **semantic shortcuts**, or **misleading UX** under load.  
**Last updated:** 2026-04-15

---

## Objectives

1. **No hidden authority** — Background jobs, imports, and searches do not adjudicate or rank truth.
2. **Stable blocked states** — Preconditions are described structurally (ADR-038).
3. **Navigability without ranking** — Large result sets remain usable with deterministic ordering and pagination (ADR-033, ADR-034).
4. **No accidental similarity/relevance** — No embeddings, scoring, or “related” APIs in user paths.

---

## Scenario matrix

| # | Scenario | Expected behavior | Existing coverage (examples) | Gaps / next tests |
| --- | --- | --- | --- | --- |
| S1 | Claim with **no** evidence | Empty evidence list; workflows that require evidence stay blocked; copy stays structural | `claim.resolver.spec.ts` (ADR-018), `ClaimReviewView` non-authoritative label | Playwright: claim with zero evidence mock (extend MSW); **ADR-035:** `workspace-isolation-adr035.e2e-spec.ts` (cross-user search/evidence denial) |
| S2 | **Conflicting** claims, evidence on both sides | Side-by-side display only; no “winner,” no conflict verdict | `ClaimComparisonView` tests, ADR-010 | E2E: two claims same topic, assert no conflict/agreement language |
| S3 | Many claims on same topic **without** ranking | Deterministic ordering only; no “top” result | `search.resolver.spec.ts`, `adr-033-search.spec.ts` | Stress: large list pagination UI |
| S4 | Misleading or bad evidence | Rendered as stored; no warning that implies automated quality judgment | ADR-020 evidence tests | Copy audit only (no “untrustworthy” auto-flag) |
| S5 | Incomplete review coordination | Queues show state; adjudication not implied | Review e2e specs | Assert disabled adjudication when quorum incomplete (real DB) |
| S6 | Adjudication quorum **not** met | Mutation rejected with explicit code; UI explains prerequisite | `claim-adjudication.resolver.spec.ts` | Playwright on real backend optional |
| S7 | Large imported bundles | Import validates; ordering respects ADR-027; fails closed on violation | `bundle-import-adr027.e2e-spec.ts`, `aletheia-bundle.service.spec.ts` | Load test doc: very large JSON (manual / perf job) |
| S8 | Crawl with many pages | Deterministic crawl; status/logs; no summarization | `htmlCrawlRunner.spec.ts`, HTML crawl e2e | Ops: disk/time limits per ADR-032 |
| S9 | Users expect summary/judgment | UI and onboarding deny that behavior | `adr-038-user-guidance.spec.ts`, product docs | Training materials narrative |

---

## Automated tests to prioritize

1. **Playwright** — `aletheia-frontend/e2e/adr-038-user-guidance.spec.ts` (messaging + forbidden terms).
2. **Playwright** — Extend `query-semantics.spec.ts` when adding new list surfaces (no sort controls).
3. **Backend** — Bundle import edge cases in `aletheia-bundle.service.spec.ts`; DB e2e for ADR-027.
4. **Backend** — GraphQL depth/cost limits (`graphql-validation-rules.spec.ts`, ADR-034).

---

## Manual / load tests (document only)

- **Very large bundle import** — Run in staging with timing and memory noted; expect reject or complete per schema, never partial silent repair.
- **Multi-thousand claim workspace** — Scroll/search UX without ranking; verify pagination caps.

---

## Forbidden regressions (fail the run)

- New fields: `confidence`, `score`, `similarity`, `embedding`, semantic `rank`.
- UI strings: “AI recommends,” “strongest claim,” “most relevant,” “conflict resolved.”

---

*Cross-check CI: `mvp-release-gate` includes guardrails, schema lint, and full matrix.*
