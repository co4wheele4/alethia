# Aletheia system verification report

**Verification date:** 2026-04-19 (updated same day — `createClaim` + workspace scoping)  
**Scope:** Repository audit (Prisma schema, GraphQL `schema.gql`, resolvers, bundle/import, CI workflows, frontend truth surfaces, tests).  
**Method:** Static inspection and targeted search; no assumption of correctness without code evidence.

---

## 1. Purpose alignment summary

Aletheia’s stated purpose is to record **claims as statements**, attach **evidence with provenance**, allow **explicit human adjudication**, preserve **auditability**, and **avoid software inferring truth**.

**Aligned (evidence in code):**

- **Adjudication is explicit and gated:** `adjudicateClaim` checks workspace access, evidence closure (ADR-018/019), allowed transitions, optional quorum (ADR-030), and delegates to `ClaimAdjudicationService`, which appends `AdjudicationLog` and updates the claim in one transaction (`claim-adjudication.resolver.ts`, `claim-adjudication.service.ts`).
- **Review coordination does not mutate claims:** `requestReview`, `reviewRequestsByClaim`, assignments, and responses enforce evidence-closure for review flows and do not change claim status (`review-request.resolver.ts` and related resolvers).
- **Search is deterministic and non-semantic:** `searchClaims` / `searchEvidence` use Prisma string filters and explicit `orderBy` (`DeterministicOrderBy`: `createdAt` / `id` only) — `search.resolver.ts`.
- **GraphQL contract guards:** `assertNoDerivedSemantics` and related tests reject `score`, `rank`, `confidence`, etc., in queries and variables (`assertNoDerivedSemantics.ts`, `app.module.ts` wiring).
- **Bundle import rejects semantic extension keys:** `confidence`, `score`, `rank`, `relevance`, `similarity`, `embedding` — `aletheia-bundle.service.ts`.
- **Claim–evidence graph UI (frontend):** `claimsToGraph` builds **only** claim → evidence edges, explicitly documented — `app/features/claimGraph/transform.ts`.
- **Production search page:** `app/search/page.tsx` uses `searchClaims` with explicit ordering and states that results are **not** ordered by match quality.

**Partial / nuanced:**

- **Lifecycle naming:** GraphQL input uses `ClaimLifecycleState.REVIEW` while persisted status is `ClaimStatus.REVIEWED`. Behavior is documented in the adjudication resolver; this is naming consistency, not an inference bug.
- **Legacy claim evidence:** Resolver maps legacy `ClaimEvidence` rows into an `Evidence`-shaped view for compatibility (`claim.resolver.ts`). This is structural bridging, not scoring.

---

## 2. Feature completeness status

| Required capability | Status | Notes |
|---------------------|--------|--------|
| 1. Claim creation | **Present** | `Mutation.createClaim(text)` creates `DRAFT` claims with `createdByUserId` set to the authenticated user. Workspace list/search visibility includes `createdByUserId` matches (`claim-workspace-visibility.ts`). E2E: `aletheia-backend/test/e2e/cross-cutting/create-claim-workspace.e2e-spec.ts`. Admin `importBundle` remains separate. |
| 2. Evidence creation | **Present** | `createEvidence` with verbatim validation and immutability — `evidence.resolver.ts`. |
| 3. Claim–evidence linking | **Present** | `linkEvidenceToClaim`, optional `claimIds` on `createEvidence`. |
| 4. Blocking: no adjudication without evidence | **Present** | Resolver + DB trigger `trg_claims_epistemic_enforcement` (ADR-027). |
| 5. Blocking: no review workflows without evidence (ADR-018) | **Present** | `requestReview` / `reviewRequestsByClaim` — `review-request.resolver.ts`. |
| 6. Explicit adjudication mutation | **Present** | `adjudicateClaim` + `ClaimAdjudicationService`. |
| 7. Coordination does not mutate claims | **Present** | Review models and resolvers; claim updates only via adjudication service + bundle path (see below). |
| 8. Evidence rendered as stored | **Mostly** | Evidence model stores `snippet`; `EvidenceViewer` is verbatim-oriented. Some list paths slice/normalize chunk text for entity mentions (`EvidenceList.tsx`) — different subsystem from ADR-019 `Evidence`. |
| 9. Deterministic querying | **Present** | Search + list ordering; ADR-033. |
| 10. Import/export bundles | **Present** | `exportBundle` / `importBundle` (admin), ordered import — `aletheia-bundle.service.ts`. |
| 11. HTML ingestion bounded | **Present** | `HtmlCrawlIngestionRun` + config types; evidence `HTML_PAGE` / `rawBody` — schema and resolver layer. |
| 12. Full auditability | **Present** | `AdjudicationLog` chain (ADR-036 hashes), `EpistemicEvent` admin listing; claim status updates allowlisted in tooling (`adr023-lifecycle-integrity.cjs`). |

---

## 3. Violations by severity

### CRITICAL (epistemic inference / hidden authority in product API)

**None found** in GraphQL schema, resolvers, or production UI paths reviewed for:

- confidence, ranking, relevance ordering, vector similarity search, summarization-as-truth, or automated verdicts **in exposed API or live search UI**.

The **production** `Search` page does not use `relevanceScore` or semantic ranking (`app/search/page.tsx`).

---

### HIGH

| Finding | Why it matters | Files / areas |
|--------|----------------|----------------|
| **Mutable document chunks vs immutable evidence** | `Evidence` rows are DB-immutable, but `updateChunk` can change `DocumentChunk.content` after evidence anchors exist, so offsets/snippet can drift from live chunk text unless process forbids edits. | `document-chunk.resolver.ts` (`updateChunk`); evidence create path `evidence.resolver.ts` |
| **Legacy schema: vectors and internal scores** | `Embedding` model and `AiQueryResult.score` persist vectors/scores; **not** exposed in `schema.gql`. Risk if future code wires them to user-facing features without ADR. | `prisma/schema.prisma` |
| **DB enforcement vs app-only** | Strong for claims/evidence triggers (ADR-027); adjudication log precondition for terminal states is in DB. **Claim text** immutability is by absence of update API, not a DB CHECK. | `prisma/migrations/20260409160000_adr027_epistemic_db_constraints/migration.sql` |

---

### MEDIUM

| Finding | Notes |
|--------|--------|
| **Search UI components (`SearchResultExplanation`, `SearchResultList`)** | Comment text “semantic relevance” and optional `relevanceScore` UI **exist in the component library** and tests; they are **not** used by `app/search/page.tsx`. Risk if wired to backend later without review. |
| **Entity mention `confidence` column** | Present in DB with `@ignore` in Prisma; not in GraphQL. |
| **Whitespace normalization in some excerpt fallbacks** | e.g. `EvidenceList.tsx` excerpt fallback — not claim-evidence “verdict” semantics but mild transformation. |

---

### LOW

| Finding | Notes |
|--------|--------|
| Naming `REVIEW` vs `REVIEWED` | Documented mapping in adjudication resolver. |
| `ScoreMeter` in clarity feature | Exported component; **no** usage found in app routes beyond its definition (grep). |

---

## 4. Files impacted (audit trail)

- **Schema / contracts:** `aletheia-backend/src/schema.gql`, `aletheia-backend/prisma/schema.prisma`
- **Adjudication & evidence:** `aletheia-backend/src/graphql/resolvers/claim-adjudication.resolver.ts`, `claim-adjudication.service.ts`, `evidence.resolver.ts`, `review-request.resolver.ts`, `search.resolver.ts`
- **DB epistemic triggers:** `aletheia-backend/prisma/migrations/20260409160000_adr027_epistemic_db_constraints/migration.sql`
- **Bundles:** `aletheia-backend/src/bundle/aletheia-bundle.service.ts`, `aletheia-backend/src/graphql/resolvers/aletheia-bundle.resolver.ts`
- **Guards:** `aletheia-backend/src/graphql/guards/assertNoDerivedSemantics.ts`
- **Frontend search (production):** `aletheia-frontend/app/search/page.tsx`
- **Frontend search (unused relevance UI):** `aletheia-frontend/app/features/search/components/SearchResultExplanation.tsx`, `SearchResultList.tsx`
- **CI:** `.github/workflows/mvp-release-gate.yml`, `.github/workflows/governance-bot.yml`, `.github/workflows/test.yml`

---

## 5. Missing functionality

1. **Optional hardening:** forbid or warn on `DocumentChunk` content updates when `Evidence` or legacy anchors reference the chunk (would strengthen verbatim traceability). Not a CRITICAL epistemic API violation by itself.
2. **Legacy DB models:** `Embedding` / internal scores remain in Prisma for historical rows; they are **not** exposed in `schema.gql`. Future exposure requires ADR review.

---

## 6. Recommended follow-ups (non-blocking for GO)

1. **Policy or DB constraint** on `updateChunk` when evidence references a chunk (see §3 HIGH).
2. **Remove or quarantine** `SearchResultExplanation` relevance-oriented UI **or** align copy strictly with mechanical match explanation (ADR-033/038) to avoid future drift.
3. **Migrate or isolate** legacy `Embedding` rows if the goal is zero vector columns in the database — requires ADR if product-visible.

---

## 7. FINAL STATUS: **GO** (with documented residual risks)

**Classification:**

- **CRITICAL:** None identified in the exposed GraphQL contract and primary UI for inference, ranking, or semantic search as implemented today.
- **Core functionality:** **Claim creation** is available to authenticated users via `createClaim`, with ADR-035 workspace visibility for drafts without evidence.
- **HIGH:** Residual data-integrity risks (mutable chunks vs immutable evidence snippets; legacy DB columns) — tracked explicitly; not treated as ship-blocking for epistemic API correctness.
- **Governance / CI:** **Present** — `mvp-release-gate` and `governance-bot` are the required mechanical gates (see `docs/compliance/mvp-branch-protection.md`).

**Operator note:** Default-branch green runs of the two gates must still be confirmed in GitHub Actions for the exact release SHA; local verification does not replace CI (see `docs/compliance/final-mvp-release-readiness.md`).

---

## Core principle check

**“Impossible for the system to imply or determine truth without explicit human adjudication”** — **Supported in the main GraphQL and adjudication paths reviewed** (explicit adjudication, deterministic search, coordination-only reviews, bundle key rejection, DB triggers for evidence and terminal claim states).

Residual risk lies in **data-entry gaps** (no public claim creation), **mutable chunks** relative to frozen evidence, and **legacy DB columns** not currently exposed — not in active ranking or confidence APIs.
