# Final MVP release readiness — Aletheia

## 1. Metadata

| Field | Value |
| --- | --- |
| **Last publisher pass** | **2026-04-20** (GitHub Actions verified via `gh`; docs updated same day) |
| **Repository** | `https://github.com/co4wheele4/alethia` |
| **Default branch** | `master` |
| **Shipping commit (mechanical CI proof below)** | **`b3d01dff63d9e4dbfbc73aacb749a48b9b7be38c`** |
| **Note on `master` tip** | Later commits may only change compliance markdown; the **verified snapshot** for gates in §2.1 remains **`b3d01df`** unless application code or workflows change (re-verify). |

---

## 2. Proof — required workflows on the shipping SHA

Authoritative jobs (project policy): **`mvp-release-gate`**, **`governance-bot`** (see `.github/workflows/mvp-release-gate.yml`, `.github/workflows/governance-bot.yml`).

### 2.1 Current proof — `b3d01df` (`docs(compliance): align shipping SHA with verified tip c802b51`)

Readiness text aligned with the branch state that already had green checks on **`c802b51`**; **`b3d01df`** is the **authoritative verification snapshot** for the table below (full matrix re-run on this commit).

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24686240749` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24686240791` |

### 2.2 Prior proof — `c802b51` (`docs(compliance): publisher evidence for 0f9433f and ruleset gap`)

Publisher pass: compliance docs record Actions evidence, ruleset **`master-protection`** facts, and **PROVISIONAL GO** (ruleset does not yet require **`mvp-release-gate`** by name — §3.1).

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24685201842` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24685201894` |

### 2.3 Prior proof — `0f9433f` (`chore(ci): sync root package-lock.json for npm ci in Actions`)

This commit restores **`npm ci`** compatibility for GitHub Actions after **`b9fab3c`** left the root lockfile out of sync (prior push runs failed at **Install dependencies** with `npm error code EUSAGE`). Ancestor of **`c802b51`** / **`b3d01df`**.

| Check (job name) | Result | Workflow run URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24684093554` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24684093551` |

**Optional overlap:** root **Tests** workflow on the same push — `https://github.com/co4wheele4/alethia/actions/runs/24684093546` (SUCCESS).

### 2.4 Historical proof (archived — do not treat as current)

Earlier recorded green runs (e.g. on `d597a05`) remain listed for audit history only; **shipping decisions use the latest table in §2.1** for the commit you deploy.

| Check (job name) | Result (historical) | Workflow run URL |
| --- | --- | --- |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24416665652` |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24416665683` |

---

## 3. Policy — default branch ruleset (GitHub API — 2026-04-20)

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

**Gap (explicit):** **`mvp-release-gate` is not listed** in the ruleset’s required-status-check payload. The workflow **did run and passed** on **`b3d01df`** (§2.1), but **merge gating via the ruleset alone does not currently require that job by name**. Operators should add **`mvp-release-gate`** to the ruleset’s required checks if policy must match §2.

Other settings from API: **`non_fast_forward`** enabled; **pull request** rule present (with bypass as above); **`strict_required_status_checks_policy`:** **false** on this ruleset.

---

## 4. Definition of done (strict)

**Done** for a release candidate **SHA** means:

1. **`mvp-release-gate`** and **`governance-bot`** are **SUCCESS** on that SHA in GitHub Actions (URLs in §2.1 for **`b3d01df`**).
2. **Documentation** records the SHA and URLs (this file).
3. **Ruleset alignment (stricter bar):** For **full governance closure**, the default-branch ruleset should **require both** job names; see §3.1 gap.

**Not done:** claiming GO without Actions evidence, or treating optional workflows as substitutes for **`mvp-release-gate`** + **`governance-bot`**.

---

## 5. Operational notes

- **Pre-push hook:** Local `pre-push` runs a large matrix; it is **not** a substitute for Actions.
- **Direct push:** Pushes to `master` may use **ruleset bypass** when the account has permission; CI still must be verified on the resulting SHA.

---

## 6. Final readiness conclusion (publisher)

| Criterion | Status |
| --- | --- |
| Shipping SHA identified | **Yes** — `b3d01dff63d9e4dbfbc73aacb749a48b9b7be38c` |
| **`governance-bot`** green on that SHA | **Yes** (URL §2.1) |
| **`mvp-release-gate`** green on that SHA | **Yes** (URL §2.1) |
| Ruleset lists **`mvp-release-gate`** as required | **No** (§3.1 — policy gap) |

**Overall release documentation status:** **PROVISIONAL GO**

**Rationale:** Mechanical CI is **green** on the documented shipping SHA for **both** authoritative workflows. **Full GO** under the strict rule (“branch protection requires the intended checks”) is **not** claimed because the active ruleset’s required-check list does not yet include **`mvp-release-gate`** by name. Close the gap in **Settings → Rules → Rulesets → `master-protection` → Required status checks** by adding **`mvp-release-gate`**, then re-record here.

**Residual (non-blocking for code correctness):** Dependabot / npm audit advisories on the repo; track via GitHub **Security** tab.

---

*End of report.*
