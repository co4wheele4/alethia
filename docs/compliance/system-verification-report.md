# Aletheia system verification report

**Verification date:** 2026-04-19  
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
| 1. Claim creation | **Gap** | No `createClaim` (or equivalent) mutation in `schema.gql`. Production `prisma.claim.create` usage in `src/` is **only** `AletheiaBundleService` import path. Claims for normal users are not creatable via GraphQL except indirectly if pre-seeded or imported by **ADMIN** (`importBundle`). |
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
| **No general GraphQL claim creation** | Core workflow “create claim → attach evidence → adjudicate” is incomplete for non-admin users; claims only appear via seed, direct DB, or **ADMIN** `importBundle`. | `schema.gql` (no create claim); `aletheia-bundle.resolver.ts`; `aletheia-bundle.service.ts` |
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

1. **End-user (non-admin) claim authoring via API** — no `createClaim` mutation; operational reliance on admin import or out-of-band data setup.
2. **Optional:** hard guard preventing `updateChunk` when evidence references a chunk (would strengthen “verbatim traceability”).

---

## 6. Recommended fixes

1. **Add a governed `createClaim` mutation** (or documented product flow) that creates `DRAFT` claims without adjudication, scoped by workspace/auth, with tests and e2e — unless a binding ADR explicitly reserves claim creation to import-only.
2. **Policy or DB constraint:** forbid or warn on `DocumentChunk` content updates when `Evidence` or legacy anchors reference the chunk (or split immutable content snapshots).
3. **Remove or quarantine** `SearchResultExplanation` relevance UI **or** align copy and props strictly with mechanical match explanation (no “relevance %”) to avoid future drift.
4. **Document or migrate** `Embedding` / `AiQueryResult.score`: either remove from schema, or isolate via ADR with explicit non-exposure guarantees.

---

## 7. FINAL STATUS: **NO-GO**

**Reason:** The verification gate requires **all core functionality present** and **zero CRITICAL violations**.

- **CRITICAL:** None identified in the exposed API and primary UI for inference/ranking as implemented today.
- **Core functionality:** **Claim creation for normal users is not available via the GraphQL API** (only admin bundle import and non-API seed paths were found). That is a **HIGH** gap against the stated “claim creation” requirement.
- **Governance / CI:** **Present** — `mvp-release-gate` runs schema checks, guardrails, ADR tests, Postgres-backed setup, and full test matrix (`mvp-release-gate.yml`); `governance-bot` enforces schema snapshot and mechanical checks.

**Condition to reach GO:** Add (or formally document as out-of-scope with ADR) a **claim creation** path that satisfies product requirements, and address **HIGH** items (especially claim authoring and chunk/evidence consistency) to the team’s satisfaction.

---

## Core principle check

**“Impossible for the system to imply or determine truth without explicit human adjudication”** — **Supported in the main GraphQL and adjudication paths reviewed** (explicit adjudication, deterministic search, coordination-only reviews, bundle key rejection, DB triggers for evidence and terminal claim states).

Residual risk lies in **data-entry gaps** (no public claim creation), **mutable chunks** relative to frozen evidence, and **legacy DB columns** not currently exposed — not in active ranking or confidence APIs.
