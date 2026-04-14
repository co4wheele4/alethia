# MVP branch protection (GitHub)

Configure the **default branch** (`master` in this repository; some forks use `main`) so merges cannot bypass mechanical epistemic gates.

Repository automation cannot set branch protection from this repo; apply rules in **Settings → Branches → Branch protection rules**.

## Required status checks (recommended minimum)

Require **all** of the following to pass before merging:

| Check name (GitHub UI) | Workflow file | What it proves |
| --- | --- | --- |
| **`mvp-release-gate`** | `.github/workflows/mvp-release-gate.yml` | ADR hygiene + index, ADR Jest compliance, workspace ESLint, GraphQL no-semantic-queries lint, PR **epistemic** + **agent-role** diff guards, `schema:check`, GraphQL codegen matches `aletheia-backend/src/schema.gql`, **Postgres 15** service + migrations, **Playwright** browsers, presence of bundle-import e2e, full **`test-all`** matrix (frontend unit + Playwright multi-browser on CI, backend unit + **real-DB** Jest e2e including `bundle-import-adr027`). |
| **`governance-bot`** | `.github/workflows/governance-bot.yml` | Full-history checkout, `schema:generate`, schema snapshot test, **Governance Bot CLI** (schema lint, ADR checks, ADR index, ADR governance Jest, agent-role diff with explicit base/head), **`npm run test:guardrails`**. Does **not** re-run the full monorepo e2e matrix (that is **`mvp-release-gate`** only). |

### Optional / overlapping

| Check name | Workflow | Notes |
| --- | --- | --- |
| **ADR Governance Checks**, **Epistemic Guardrails**, **Unit Tests**, **E2E Tests**, etc. | `.github/workflows/test.yml` | Additional coverage (codecov, resolver e2e reminder script). Safe to enable if you want redundancy; not a substitute for **`mvp-release-gate`**. |

## Branch protection settings

- Require a pull request before merging.
- Require status checks to pass before merging (select the jobs above by **exact name** as shown in Actions).
- Require branches to be up to date before merging (recommended).
- Do not allow bypassing the required checks for administrators if you need strict MVP assurance.

## Verification

After opening a PR, confirm that **both** `mvp-release-gate` and `governance-bot` appear in the checks list and both succeed.
