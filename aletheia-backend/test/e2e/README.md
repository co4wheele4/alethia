# E2E Test Organization

**Last Updated**: May 6, 2026  
**Status**: Migration complete (no monolithic `graphql.e2e-spec.ts`)

This directory contains backend E2E tests organized by concern. Additional suites live alongside it under `test/` (see `jest-e2e.json`).

## Directory structure (core)

```
test/e2e/
├── resolvers/
│   ├── app.resolver.e2e-spec.ts
│   ├── auth.resolver.e2e-spec.ts
│   ├── user.resolver.e2e-spec.ts
│   ├── entity.resolver.e2e-spec.ts
│   ├── html-crawl-ingestion.resolver.e2e-spec.ts
│   └── review-assignment.resolver.e2e-spec.ts
├── cross-cutting/
│   ├── error-cases.e2e-spec.ts
│   ├── validation-edge-cases.e2e-spec.ts
│   ├── pagination-edge-cases.e2e-spec.ts
│   ├── partial-updates.e2e-spec.ts
│   ├── relationship-edge-cases.e2e-spec.ts
│   ├── workspace-isolation-adr035.e2e-spec.ts
│   └── create-claim-workspace.e2e-spec.ts
├── bundle/
│   └── bundle-import-adr027.e2e-spec.ts
└── db/
    └── adr027-epistemic-constraints.e2e-spec.ts
```

**Also under `test/`:** `app.e2e-spec.ts`, `db-setup-verification.e2e-spec.ts`.

Legacy **`ai-query.resolver.e2e-spec.ts`** was removed **2026-05-06** with the migration that dropped `ai_queries` / related tables.

**Inventory:** run `npx jest --config ./test/jest-e2e.json --listTests` from `aletheia-backend/` (currently **17** spec paths including the files above).

## Running tests

```bash
cd aletheia-backend
npm run test:e2e
npm run test:e2e -- test/e2e/resolvers/user.resolver.e2e-spec.ts
```

## Notes

- Some Prisma/Nest log errors during runs are **expected**: tests intentionally hit constraint and validation failure paths.
