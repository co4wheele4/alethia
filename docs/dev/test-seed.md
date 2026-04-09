# Test database seed

This project uses **PostgreSQL** with **Prisma** (`aletheia-backend/prisma/schema.prisma`). The deterministic showcase dataset lives in `aletheia-backend/scripts/seed/test-seed.lib.ts`; the CLI entry is `aletheia-backend/scripts/seed/testSeed.ts`.

## Safety

The seed **refuses to run** unless the database name in `DATABASE_URL` is exactly `aletheia_test`. Point `aletheia-backend/.env.test` at a dedicated local or CI database.

Do not aim this script at production or shared dev databases.

## Commands

From the repository root:

```bash
npm run db:seed:test
```

Equivalent (backend package):

```bash
npm run db:seed:test --workspace=aletheia-backend
```

The implementation file is `aletheia-backend/scripts/seed/testSeed.ts` (Prisma must run from that package). A small delegator is also available:

```bash
node scripts/seed/testSeed.cjs
```

Full reset (migrate reset + seed):

```bash
npm run db:reset:test
```

```bash
node scripts/db/resetTestDb.cjs
```

## Schema note (lifecycle naming)

GraphQL adjudication uses `ClaimLifecycleState.REVIEW` as input for the transition that persists as **`ClaimStatus.REVIEWED`** in PostgreSQL (ADR-011). The seed data uses the persisted enum values (`DRAFT`, `REVIEWED`, `ACCEPTED`, `REJECTED`).

## What gets populated

- **Users**: one `ADMIN`, three reviewers, two authors (fixed IDs, shared bcrypt test password hash).
- **Documents and chunks**: verbatim text used only as reproducible sources for `Evidence` spans (ADR-019/024).
- **Evidence**: `DOCUMENT`-sourced rows with chunk offsets, verbatim `snippet`, and `contentSha256` (no summarization).
- **Claims**: twelve lifecycle examples — `DRAFT` (including two with no evidence), `REVIEWED`, `ACCEPTED`, `REJECTED` — plus coordination edge cases (review requests with/without assignments, assignments with/without responses, multi-reviewer and decline responses).
- **ClaimEvidenceLink**: many-to-many links, including a small structural “showcase” graph (shared evidence across multiple claims — navigational only, not similarity).
- **ReviewRequest / ReviewAssignment / ReviewerResponse**: coordination-only artifacts; they do not adjudicate claims.
- **AdjudicationLog**: append-only records for lifecycle transitions performed through the adjudication pathway (ADR-023).

## What you should see in the UI

After seeding and signing in as a user that can read claims (per your auth setup):

- Claims list spans all lifecycle states present in the schema (`DRAFT`, `REVIEWED`, `ACCEPTED`, `REJECTED`).
- Claim detail shows linked evidence and documents derived from evidence.
- Evidence detail shows raw spans as stored (no highlighting or summarization).
- Review coordination screens list requests, assignments, and reviewer responses (`ACKNOWLEDGED` / `DECLINED`).
- Adjudication history comes from `AdjudicationLog` / claim adjudication metadata — not from review coordination.

## Warnings (epistemic contract)

- No **confidence**, scoring, ranking, or derived “strength” of evidence appears in this seed.
- Claims are **statements**, not facts; evidence is **referential and inspectable**, not proof.
- Shared evidence across claims demonstrates **graph linkage only** — not semantic equivalence.

## Verification

- Automated checks run at the end of `runTestSeed` (ADR-018 closure, hash consistency, forbidden-language scan).
- Jest integration tests: `tests/seed/seedIntegrity.test.ts` (Jest `rootDir` is the monorepo root in `test/jest-e2e.json`; run with `npm run test:e2e` when `DATABASE_URL` points at `aletheia_test`).
