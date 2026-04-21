# Final MVP release readiness — Aletheia

## 1. Metadata

| Field | Value |
| --- | --- |
| **Last publisher pass** | **2026-04-21** (ruleset `master-protection` verified via `gh api`; readiness doc updated same day) |
| **Repository** | `https://github.com/co4wheele4/alethia` |
| **Default branch** | `master` |
| **Shipping commit (mechanical CI proof below)** | **`903aa08e8707db2473a0bd4bad9b169257a8b137`** |
| **Note on `master` tip** | Subsequent doc-only commits should re-list checks or remain descendants of this SHA; re-verify if application code or workflows change. |

---

## 2. Proof — required workflows on the shipping SHA

Authoritative jobs (project policy): **`mvp-release-gate`**, **`governance-bot`** (see `.github/workflows/mvp-release-gate.yml`, `.github/workflows/governance-bot.yml`).

### 2.1 Current proof — `903aa08` (`docs(compliance): record b3d01df gate URLs and verification snapshot`)

Compliance markdown updated; **full matrix re-run** on this commit. **Authoritative verification** for default-branch tip at time of publisher close-out.

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24687383270` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24687383280` |

### 2.2 Prior proof — `b3d01df` (`docs(compliance): align shipping SHA with verified tip c802b51`)

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24686240749` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24686240791` |

### 2.3 Prior proof — `c802b51` (`docs(compliance): publisher evidence for 0f9433f and ruleset gap`)

Publisher pass: compliance docs record Actions evidence and ruleset **`master-protection`** facts (historical — before **`mvp-release-gate`** was required on the ruleset; see §3.1 current list).

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24685201842` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24685201894` |

### 2.4 Prior proof — `0f9433f` (`chore(ci): sync root package-lock.json for npm ci in Actions`)

This commit restores **`npm ci`** compatibility for GitHub Actions after **`b9fab3c`** left the root lockfile out of sync (prior push runs failed at **Install dependencies** with `npm error code EUSAGE`). Ancestor of **`c802b51`** / **`b3d01df`** / **`903aa08`**.

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24684093554` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24684093551` |

**Optional overlap:** root **Tests** workflow on the same push — `https://github.com/co4wheele4/alethia/actions/runs/24684093546` (SUCCESS).

### 2.5 Historical proof (archived — do not treat as current)

Earlier recorded green runs (e.g. on `d597a05`) remain listed for audit history only; **shipping decisions use the latest table in §2.1** for the commit you deploy.

| Check (job name) | Result (historical) | Workflow run URL |
| --- | --- | --- |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24416665652` |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24416665683` |

---

## 3. Policy — default branch ruleset (GitHub API — 2026-04-21)

Classic **branch protection** may be off; enforcement uses a **repository ruleset**.

| Item | Value |
| --- | --- |
| **Ruleset** | **`master-protection`** — `https://github.com/co4wheele4/alethia/rules/15268776` |
| **Scope** | `~DEFAULT_BRANCH` (`master`) |
| **Bypass** | Repository role bypass is **`always`** for the configured bypass actors (`RepositoryRole` in API); **direct pushes can bypass PR rules** when permitted. |

### 3.1 Required status checks (as returned by GitHub API)

The ruleset’s **`required_status_checks`** contexts (integration GitHub Actions) are:

- `Analyze (actions)`
- `Analyze (javascript-typescript)`
- `Check E2E Test Coverage`
- `CodeQL`
- `Epistemic Guardrails`
- **`governance-bot`**
- **`mvp-release-gate`**

**Ruleset alignment:** Both authoritative jobs (**`governance-bot`**, **`mvp-release-gate`**) are **required** on the default branch via **`master-protection`** (ruleset id **15268776**), last confirmed **2026-04-21** via `GET /repos/co4wheele4/alethia/rulesets/15268776`.

Other settings from API: **`non_fast_forward`** enabled; **pull request** rule present (with bypass as above); **`strict_required_status_checks_policy`:** **false** on this ruleset.

---

## 4. Definition of done (strict)

**Done** for a release candidate **SHA** means:

1. **`mvp-release-gate`** and **`governance-bot`** are **SUCCESS** on that SHA in GitHub Actions (URLs in §2.1 for **`903aa08`**).
2. **Documentation** records the SHA and URLs (this file).
3. **Ruleset alignment (stricter bar):** The default-branch ruleset **requires both** job names — see §3.1.

**Not done:** claiming GO without Actions evidence, or treating optional workflows as substitutes for **`mvp-release-gate`** + **`governance-bot`**.

---

## 5. Operational notes

- **Pre-push hook:** Local `pre-push` runs a large matrix; it is **not** a substitute for Actions.
- **Direct push:** Pushes to `master` may use **ruleset bypass** when the account has permission; CI still must be verified on the resulting SHA.

---

## 6. Final readiness conclusion (publisher)

| Criterion | Status |
| --- | --- |
| Shipping SHA identified | **Yes** — `903aa08e8707db2473a0bd4bad9b169257a8b137` |
| **`governance-bot`** green on that SHA | **Yes** (URL §2.1) |
| **`mvp-release-gate`** green on that SHA | **Yes** (URL §2.1) |
| Ruleset lists **`mvp-release-gate`** as required | **Yes** (§3.1) |

**Overall release documentation status:** **GO**

**Rationale:** On **`903aa08`**, **`governance-bot`** and **`mvp-release-gate`** are **SUCCESS** in GitHub Actions (§2.1). The **`master-protection`** ruleset **requires both** checks by name (§3.1). Under the strict publisher rule, **full GO** is therefore recorded. **Residual governance:** repository-role **bypass** remains **`always`** for configured bypass actors (§3); merges can still be forced by admins with bypass — that is policy, not a missing check name.

**Residual (non-blocking for code correctness):** Dependabot / npm audit advisories on the repo; track via GitHub **Security** tab.

---

*End of report.*
