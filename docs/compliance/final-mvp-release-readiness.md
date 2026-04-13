# Final MVP release readiness — Aletheia

## 1. Metadata

| Field | Value |
| --- | --- |
| **Date** | 2026-04-13 |
| **Repository** | `https://github.com/co4wheele4/alethia` |
| **Branch (local validation)** | `adr-025-agent-role-restrictions` (see `git rev-parse HEAD` at merge time) |

## 2. GitHub issues

| Scope | Result |
| --- | --- |
| **Open issues** | **None** (`gh issue list --state open` returned no issues). No issue closures were required for this pass. |

## 3. Remediation gaps addressed (this pass)

| Severity | Item | Resolution |
| --- | --- | --- |
| **HIGH** | MVP Release Gate ran `test-all` without Postgres → backend e2e could not prove ADR-027 bundle import | Added **Postgres 15** service, `DATABASE_URL`, and **`npm run test:e2e:setup`** before the full matrix in `.github/workflows/mvp-release-gate.yml`. |
| **HIGH** | Playwright might fail on CI without browser binaries | **`npx playwright install --with-deps`** in `aletheia-frontend` before tests (`CI=true` enables full browser matrix). |
| **HIGH** | PR epistemic / agent guards only in `test.yml`, not in MVP gate | Added **epistemicGuard** and **agentRoleGuard** steps to **`mvp-release-gate`**. |
| **MEDIUM** | `test:e2e:setup` missing at repo root | Added **`test:e2e:setup`** script to root `package.json` (delegates to `aletheia-backend`). |
| **MEDIUM** | Bundle import e2e could be deleted without CI noticing | Added **`scripts/check-mvp-bundle-import-e2e.cjs`** and run it in the MVP gate. |
| **MEDIUM** | Governance Bot duplicated full `npm test` (entire matrix) on every PR | Replaced final step with **`npm run test:guardrails`** so **`mvp-release-gate`** is the single authoritative full matrix. |

## 4. Files changed (this pass)

- `.github/workflows/mvp-release-gate.yml` — Postgres, Playwright, setup, guards, codegen diff, artifact check, full `test-all`.
- `.github/workflows/governance-bot.yml` — guardrails only instead of full `npm test`.
- `package.json` — root `test:e2e:setup`.
- `scripts/check-mvp-bundle-import-e2e.cjs` — new fail-fast artifact check.
- `docs/compliance/mvp-launch-validation.md` — aligned with CI authority.
- `docs/compliance/mvp-release-remediation-report.md` — hardening notes.
- `docs/compliance/mvp-branch-protection.md` — required check names and roles.
- `docs/compliance/final-mvp-release-readiness.md` — this document.

## 5. Tests and commands verified locally (2026-04-13)

| Command | Result |
| --- | --- |
| `node scripts/check-mvp-bundle-import-e2e.cjs` | PASS |
| `npm run schema:check` | PASS |
| `npm run test:guardrails` | PASS |
| `npm run test:adr-governance` | PASS |
| `npm run test:cov --workspace=aletheia-backend` | PASS (616 tests) |

Full **`node scripts/test-all-with-summary.js`** was not re-run in this session on the developer machine (requires Postgres for backend e2e and Playwright browsers); **CI `mvp-release-gate`** is designated authoritative for that matrix.

## 6. GitHub issues resolved / deferred

- **Resolved in repo:** N/A (no open issues).
- **Deferred POST_MVP:** Deeper cross-tenant denial matrix for ADR-035 (see historical `docs/compliance/full-implementation-drift-audit.md`); optional removal of unused `openai` npm dependency and doc references — **not** launch-blocking if no runtime imports exist.

## 7. Required branch protection checks

Minimum recommended:

1. **`mvp-release-gate`**
2. **`governance-bot`**

See **`docs/compliance/mvp-branch-protection.md`** for the exact mapping to workflows.

## 8. Final GO / NO-GO

| Rule | Assessment |
| --- | --- |
| Zero **CRITICAL** launch blockers in shipped GraphQL and default API paths | **Satisfied** — prior C1–C4 remediated; MVP schema lint and code review confirm no embedding / askAI / extraction surfaces in `aletheia-backend/src/schema.gql` and resolvers. |
| CI can enforce Postgres-backed bundle import e2e | **Satisfied** by **`mvp-release-gate`** workflow design. |
| Governance enforced in CI | **Satisfied** — ADR checks, schema checks, PR guards, governance bot, guardrails tests. |

**Decision: GO** for MVP release readiness **provided** GitHub branch protection is configured with the required checks above and the first **`mvp-release-gate`** run on the default branch completes green after merge.

**NO-GO** if: any required check is missing on the default branch, or **`mvp-release-gate`** fails on CI (including backend e2e or Playwright).

---

*End of report.*
