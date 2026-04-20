# Final completion report — Aletheia

## 1. Date

**2026-04-19** (implementation). **2026-04-20** (publisher verification update).

## 2. Branch / commit

- **Mechanical CI proof (default branch tip):** **`c802b51c4551a8d04ee5433a306190c31d04fe91`** — see [`docs/compliance/final-mvp-release-readiness.md`](final-mvp-release-readiness.md) §2.1 for **`governance-bot`** and **`mvp-release-gate`** SUCCESS URLs.
- **Lockfile CI fix (ancestor):** **`0f9433f`** (`npm ci` / root `package-lock.json` sync).
- **Prior feature commit (createClaim / compliance):** **`878a80f`** (ancestor of the above).

## 3. What remained at start

- System verification listed **NO-GO** primarily because **end-user claim creation** was missing from the GraphQL API, while draft claims without evidence were **invisible** in workspace lists (ADR-035 scope only through evidence → documents).
- Operational docs mixed **historical** NO-GO audit language with **post-remediation** GO; **CI proof** remained environment-dependent.
- Final **`docs/compliance/final-completion-report.md`** did not exist.

## 4. What was implemented

- **`createClaim` mutation** — Creates `DRAFT` claims with **`createdByUserId`**; authenticated users can author statements without admin import.
- **Workspace visibility helper** — `claimWorkspaceOr` (`aletheia-backend/src/graphql/utils/claim-workspace-visibility.ts`) extends ADR-035 predicates so draft claims created by the user appear in `claims` / `searchClaims` / adjudication and review scoping **before** evidence is linked.
- **Evidence ↔ claim linking hardening** — `linkEvidenceToClaim` and `createEvidence` claim attachment paths resolve claims with the same workspace predicate (prevents cross-tenant linking by ID guess).
- **Prisma migration** — `20260419120000_claim_created_by_user` (`created_by_user_id` FK to `users`).
- **GraphQL model** — Optional `createdByUserId` on `Claim`; root `src/schema.gql` kept in sync with backend snapshot.
- **Tests** — Unit test updates; new e2e `aletheia-backend/test/e2e/cross-cutting/create-claim-workspace.e2e-spec.ts`.
- **Docs** — Updated `docs/compliance/system-verification-report.md`, `docs/compliance/final-mvp-release-readiness.md`, `docs/adr/ADR-035-workspace-isolation-rbac.md`.

## 5. Docs added or updated

| Path | Change |
| --- | --- |
| `docs/compliance/final-completion-report.md` | **Created** (this file). |
| `docs/compliance/system-verification-report.md` | **GO** status; claim creation present; residual HIGH risks documented. |
| `docs/compliance/final-mvp-release-readiness.md` | Date and operator CI reminder. |
| `docs/adr/ADR-035-workspace-isolation-rbac.md` | Implementation note for `createClaim` / `createdByUserId`. |
| `src/schema.gql` | Synced with backend schema snapshot. |

## 6. Tests and guards added or updated

| Item | Notes |
| --- | --- |
| Resolver unit tests | `claim`, `search`, `review-request`, `evidence` expectations updated for workspace OR. |
| Backend e2e | `create-claim-workspace.e2e-spec.ts`. |
| Existing guardrails | Unchanged behavior; `tests/guardrails.spec.ts` still enforces canonical context + Cursor rule. |

## 7. What remains manual or CI-authoritative

- **GitHub Actions:** Recorded for **`c802b51`** in `final-mvp-release-readiness.md` §2.1 (2026-04-20 publisher pass).
- **Ruleset:** Add **`mvp-release-gate`** to the default-branch ruleset required checks if merge policy must match both gates by name (see `final-mvp-release-readiness.md` §3.1).
- **Production deployment:** Postgres migrations, secrets, and gateway rate limits are environment-specific.

## 8. Remaining gaps (honest)

- **HIGH (non-CRITICAL):** `DocumentChunk` content may still be mutated via `updateChunk` while evidence references chunk offsets — traceability risk, not an inference API.
- **MEDIUM:** Legacy search UI components may still contain “relevance”-oriented **library** code; production search page remains deterministic (see system verification report).
- **Governance (2026-04-20):** GitHub ruleset **`master-protection`** does not yet list **`mvp-release-gate`** as a required context; both workflows are nevertheless **green** on **`c802b51`** (see readiness §2.1).

## 9. Recommended next action

1. Add **`mvp-release-gate`** to ruleset **required status checks** if policy must match both gates at merge time.  
2. Keep **`npm ci`** clean: after any dependency edit, run **`npm install`** at the repo root and commit **`package-lock.json`** before merging to `master`.

## 10. Final status

**PROVISIONAL GO**

**Rationale:** On **`c802b51`**, **`governance-bot`** and **`mvp-release-gate`** are **SUCCESS** in GitHub Actions (evidence: `final-mvp-release-readiness.md` §2.1). **Full GO** under the strict publisher rule is **not** claimed until the default-branch ruleset **requires `mvp-release-gate`** by name (currently missing — §3.1 there).

**What Aletheia can safely do next**

- Ship behind the two mechanical gates once they are green on the target commit.
- Expand blocked-state UX and copy within **ADR-038** (structural prerequisites only).
- Operational drills: bundle export/import, backup validation per `docs/ops/backup-restore-validation.md`.

**What still requires ADR review**

- Any user-visible **judgment**, ranking, summarization, similarity, or automated conflict **conclusions**.
- Exposing legacy embedding/score columns or adding semantic search.
- Relaxing ingestion determinism (ADR-032) or evidence immutability expectations.

---

*Cross-references: [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md), [`docs/roadmap/post-mvp-roadmap.md`](../roadmap/post-mvp-roadmap.md).*
