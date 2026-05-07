# E2E Test Organization

## Overview

Backend e2e tests live under **`aletheia-backend/test/`** and are picked up by **`jest --config ./test/jest-e2e.json`**. Layout:

- **`test/e2e/resolvers/`** — Resolver-focused GraphQL suites
- **`test/e2e/cross-cutting/`** — Validation, errors, pagination, workspace, claim flows
- **`test/e2e/bundle/`**, **`test/e2e/db/`** — Bundle import and ADR-027 DB constraints
- **`test/app.e2e-spec.ts`**, **`test/db-setup-verification.e2e-spec.ts`** — Smoke / DB safety

Legacy **`ai-query.resolver.e2e-spec.ts`** was removed with the **2026-05-06** API and migration that dropped `AiQuery` / related tables.

## Current structure (representative)

```
aletheia-backend/test/
├── e2e/
│   ├── resolvers/
│   │   ├── app.resolver.e2e-spec.ts
│   │   ├── auth.resolver.e2e-spec.ts
│   │   ├── user.resolver.e2e-spec.ts
│   │   ├── entity.resolver.e2e-spec.ts
│   │   ├── html-crawl-ingestion.resolver.e2e-spec.ts
│   │   └── review-assignment.resolver.e2e-spec.ts
│   ├── cross-cutting/
│   │   ├── error-cases.e2e-spec.ts
│   │   ├── validation-edge-cases.e2e-spec.ts
│   │   ├── pagination-edge-cases.e2e-spec.ts
│   │   ├── partial-updates.e2e-spec.ts
│   │   ├── relationship-edge-cases.e2e-spec.ts
│   │   ├── workspace-isolation-adr035.e2e-spec.ts
│   │   └── create-claim-workspace.e2e-spec.ts
│   ├── bundle/
│   │   └── bundle-import-adr027.e2e-spec.ts
│   ├── db/
│   │   └── adr027-epistemic-constraints.e2e-spec.ts
│   ├── README.md
│   ├── TEST_ORGANIZATION.md
│   └── TEST_VERIFICATION_SUMMARY.md
├── helpers/            # `test-setup.ts`, `test-db.ts`, `graphql-request.ts`
├── app.e2e-spec.ts
└── db-setup-verification.e2e-spec.ts
```

Run **`npx jest --config ./test/jest-e2e.json --listTests`** for the exact file list on your branch.

## Quick start

### Adding a resolver-focused test

1. Add or edit `test/e2e/resolvers/<name>.resolver.e2e-spec.ts`
2. Use `setupTestApp` / `teardownTestApp` from the path shown in existing resolver specs (imports vary by folder depth).

### Running tests

```bash
cd aletheia-backend
npm run test:e2e
npm run test:e2e -- test/e2e/resolvers/user.resolver.e2e-spec.ts
```

## Migration status

- **No monolithic `graphql.e2e-spec.ts`** in this suite.
- **AI query e2e** removed **2026-05-06** together with legacy GraphQL/DB surfaces.
