# E2E Test Coverage Analysis (Backend)

**Last Updated**: January 14, 2026  
**Status**: ✅ All backend e2e suites passing and organized

## Current Totals (Verified)

- **Test Suites**: 12
- **Tests**: 56

## Test Organization

Backend e2e tests are organized by concern:

- **Resolver-focused suites**: `test/e2e/resolvers/`
  - `app.resolver.e2e-spec.ts` (3)
  - `auth.resolver.e2e-spec.ts` (5)
  - `user.resolver.e2e-spec.ts` (10)
  - `entity.resolver.e2e-spec.ts` (3)
  - `ai-query.resolver.e2e-spec.ts` (4)

- **Cross-cutting suites**: `test/e2e/cross-cutting/`
  - `error-cases.e2e-spec.ts` (12)
  - `validation-edge-cases.e2e-spec.ts` (5)
  - `pagination-edge-cases.e2e-spec.ts` (3)
  - `partial-updates.e2e-spec.ts` (2)
  - `relationship-edge-cases.e2e-spec.ts` (2)

- **General e2e suites** (Jest picks these up from `test/`)
  - `app.e2e-spec.ts` (1)
  - `db-setup-verification.e2e-spec.ts` (6)

## What “Coverage” Means Here

This document is about **behavioral/API coverage** (what GraphQL operations and edge cases are tested end-to-end), not Jest/V8 line coverage.

## Expected Errors in Logs

Some Prisma/Nest exceptions in the logs are **expected** because tests intentionally verify:

- Unique constraint violations (e.g. Prisma `P2002`)
- Foreign key violations (e.g. Prisma `P2003`)
- Validation errors (e.g. PrismaClientValidationError)

## How to Run

```bash
cd aletheia-backend
npm run test:e2e
```

