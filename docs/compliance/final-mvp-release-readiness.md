# Final MVP release readiness — Aletheia

## 1. Metadata

| Field | Value |
| --- | --- |
| **Date** | 2026-04-19 (final completion pass; re-confirm CI on GitHub for the shipping SHA) |
| **Repository** | `https://github.com/co4wheele4/alethia` |
| **Default branch** | `master` |
| **Local workspace tip (executor)** | Record at verification time; **`git rev-parse HEAD`** on the branch under test |
| **Recorded merge-base / proof commit (historical green)** | **`d597a05d522ed9776e8489ae07b288a9769f2a09`** (`test(e2e): stabilize WebKit graph edges and compare navigation`) |

## 2. Proof — CI on default branch (`master`)

Authoritative status checks are the **job names** `mvp-release-gate` and `governance-bot` (see `.github/workflows/mvp-release-gate.yml` and `.github/workflows/governance-bot.yml`).

| Check (job name) | Result (on **`d597a05`**) | Workflow run URL |
| --- | --- | --- |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24416665652` |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24416665683` |

**Optional overlap (not a substitute for the two gates above):** root `Tests` workflow — `https://github.com/co4wheele4/alethia/actions/runs/24416665703` (SUCCESS on the same push).

## 3. Policy — “locked” default branch (cannot merge without CI)

Classic **Branch protection** is **disabled** on this repository; enforcement uses a **repository ruleset** instead.

| Item | Value |
| --- | --- |
| **Ruleset** | **`protect`** — `https://github.com/co4wheele4/alethia/rules/14889568` |
| **Scope** | `~DEFAULT_BRANCH` (`master`) |
| **Required status checks** | **`mvp-release-gate`**, **`governance-bot`** |
| **Require up-to-date branch** | **Yes** — `strict_required_status_checks_policy: true` on the ruleset’s required-status-checks rule |
| **Block force pushes** | **Yes** — ruleset includes **`non_fast_forward`** (rewrites / force-pushes are rejected) |
| **Bypass** | **`bypass_actors: []`** — `current_user_can_bypass: never` (as returned by the API after update) |

Deletion / update rules remain as configured in the ruleset; Code scanning and code-quality rules in the same ruleset are unchanged from the prior configuration except for the added required checks.

## 4. Definition of done (strict)

**Done** means all of the following are true at the same time:

1. **CI is the proof.** The default branch has a **full green** run of **`mvp-release-gate`** and **`governance-bot`** for the commit you are shipping (URLs recorded in §2).
2. **Policy cannot be bypassed for routine merges.** Required checks and “up to date” are enforced via **ruleset `protect`** (§3), with **no bypass actors** configured, plus **`non_fast_forward`** so force-pushes to the default branch are not allowed.
3. **“It works on my machine” is not sufficient.** Local runs may omit or differ from CI (Postgres service, full Playwright matrix, timing). **Shipping decisions follow GitHub Actions results on the branch, not local anecdotes.**

**Not done:** relying only on local tests, skipping hooks without a matching green CI run on `master`, or treating a green subset of workflows as equivalent to **`mvp-release-gate`** + **`governance-bot`**.

## 5. Landing this document on `master`

This file was added in commit **`f25919d`** on branch **`docs/mvp-readiness-proof-2026-04-14`**, opened as **PR #7** (`https://github.com/co4wheele4/alethia/pull/7`). The PR re-ran the same gates; both required jobs succeeded:

| Check | Result | Job URL |
| --- | --- | --- |
| **governance-bot** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24417725780/job/71331311981` |
| **mvp-release-gate** | **SUCCESS** | `https://github.com/co4wheele4/alethia/actions/runs/24417725882/job/71331312012` |

If merge is still blocked in the UI, remaining blockers are **outside** these two checks (for example **code owner review** or other ruleset rules such as **Code scanning**). Complete those in GitHub; do not disable the required checks.

## 6. Operational notes (executor)

- **Push:** `git push` to `master` may be blocked or require bypass when rulesets / Code scanning are pending; resolve via GitHub UI / policy, not by disabling checks.
- **Pre-push hook:** `scripts/git-hooks/pre-push` runs a large local matrix; it is **not** a substitute for Actions. For long-running local verification, rely on CI or run the same steps as `.github/workflows/mvp-release-gate.yml` deliberately.
- **Regression fixed for this proof:** commit **`7a1d804`** failed **`mvp-release-gate`** (WebKit / Mobile Safari Playwright flakes). **`d597a05`** adjusts `e2e/claim-graph.spec.ts` and `e2e/review-activity.spec.ts` so the full matrix completes successfully on CI.

---

## 7. Post-MVP execution note (2026-04-19)

**Launch status (this document):** The **operational GO** definition in §4 is unchanged: shipping decisions follow **green** `mvp-release-gate` and `governance-bot` on the **exact commit** you release, via GitHub Actions.

**This document cannot prove CI by itself.** Any local “final completion” pass must still be matched to **Actions** on the default branch or PR head you intend to ship.

**Authoritative next step:** After merging, open the Actions tab and confirm **`mvp-release-gate`** and **`governance-bot`** both **SUCCESS** on the merge commit; paste run URLs into §2 if you need a renewed paper trail.

---

*End of report.*
