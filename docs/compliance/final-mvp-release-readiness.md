# Final MVP release readiness — Aletheia

## 1. Metadata

| Field | Value |
| --- | --- |
| **Date** | 2026-04-14 |
| **Repository** | `https://github.com/co4wheele4/alethia` |
| **Default branch** | `master` |
| **Validated PR head (merge candidate)** | `adr-025-agent-role-restrictions` @ **`738c86f83caab7944511a82bb6e913302569b0fc`** |

## 2. GitHub issues

| Scope | Result |
| --- | --- |
| **Open issues** | **None** (`gh issue list --state open` returned no issues). |
| **Open PR** | **PR #5** — `https://github.com/co4wheele4/alethia/pull/5` |

## 3. PR review / Code scanning threads (PR #5)

| Source | Severity | Resolution |
| --- | --- | --- |
| GitHub Advanced Security (workflow permissions) | Informational → **addressed in repo** | Workflows under `.github/workflows/` use `permissions: contents: read` where applicable; `test.yml` top-level permissions documented. Historical bot comments referred to older diffs. |
| GitHub Advanced Security (`js/request-forgery` on `import-url`) | **HIGH (scanner)** | Mitigation: `assertPublicHttpUrlForServerFetch` (DNS + `BlockList`), `redirect: manual` with validation on every hop, timeouts/size limits, `// codeql[js/request-forgery]` where needed; follow-up commit **`738c86f`** tightens fetch data flow for CodeQL. Operator comment: `https://github.com/co4wheele4/alethia/pull/5#issuecomment-4240333527` |

## 4. CI — authoritative gates (HEAD **738c86f**)

| Check (job name) | Result | Run URL |
| --- | --- | --- |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24374067513` |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24374067526` |
| **Tests** (workflow `test.yml`) | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24374067498` |

The **`Tests`** workflow on this SHA includes fixes for: workflow-level **`DATABASE_URL`** (Prisma `postinstall` / `prisma generate`), **`npm run test:cov --workspace=aletheia-backend`** + Codecov path **`aletheia-backend/coverage/lcov.info`**, and **E2E** running **`npm run test:e2e:cov --workspace=aletheia-backend`** (same backend Jest config as MVP Release Gate, not root `test/jest-e2e.json`).

## 5. Local validation (executor — 2026-04-14)

Executed on Windows with local Postgres (`aletheia-backend/.env.test`):

| Step | Result |
| --- | --- |
| `npm run lint` + `npm run type-check` | PASS |
| `npm run schema:check` | PASS |
| `npm run test:cov --workspace=aletheia-backend` | PASS (100% statements/branches/lines thresholds met after Prisma filter coverage tests) |
| `npm run test:frontend` | PASS |
| `npm run test:adr-governance` | PASS |
| `npm run test:guardrails` | PASS |
| `npm run test:e2e:setup` then `npm run test:e2e:cov --workspace=aletheia-backend` | PASS |
| `npx playwright install chromium` + `npx playwright test` (frontend) | PASS (4 tests intentionally skipped without `PLAYWRIGHT_REAL_BACKEND=1`; same as default CI) |
| `node scripts/check-mvp-bundle-import-e2e.cjs` | PASS |
| `node scripts/test-all-with-summary.js` | PASS |

## 6. Repository ruleset (GitHub **Rulesets** — not legacy branch API)

| Ruleset | ID | Enforcement | Notes |
| --- | --- | --- | --- |
| **protect** | `14889568` | active | Applies to `~DEFAULT_BRANCH` (`master`). Includes **Code scanning** (CodeQL: security **high+**, alerts **errors**), **code quality** (errors), **pull request** (merge allowed; **code owner review required**), deletion / non-fast-forward / update rules. |

**Bypass:** `current_user_can_bypass: never` for this ruleset (as reported by API).

## 7. Merge status vs “fully validated GO”

| Gate | Status |
| --- | --- |
| Local matrix (above) | **PASS** |
| **`mvp-release-gate`** + **`governance-bot`** on PR **738c86f** | **PASS** (URLs in §4) |
| GitHub **merge** of PR #5 | **BLOCKED** by repository rules: open **CodeQL** / code-scanning alerts at **error** severity (and **code owner** review required). `gh pr merge` returns: *“CodeQL has detected 1 security relevant alert blocking this code from being merged”* until alerts are fixed or dismissed per org policy. |

**Conclusion:** Epistemic **MVP mechanical gates** are green on CI for **738c86f**. **Org-level Code scanning merge gating** still prevents merging to `master` until Security / policy clears alerts (may include pre-existing alerts on `master`, not only this PR).

## 8. Final GO / NO-GO (strict)

| Rule | Verdict |
| --- | --- |
| **GO** — mechanical MVP gates + local matrix | **GO** for **738c86f** — `mvp-release-gate`, `governance-bot`, and local full matrix passed; no ADR needed for the CI/test fixes described above. |
| **NO-GO** — merge to default branch + “nothing left to prove” | **NO-GO** until GitHub **ruleset** allows merge (CodeQL + code owner + any other required checks). |

---

*End of report.*
