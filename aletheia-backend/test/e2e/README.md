# E2E Test Organization

**Last Updated**: January 14, 2026  
**Status**: ✅ Migration complete (no monolithic `graphql.e2e-spec.ts`)

This directory contains backend E2E tests organized by concern for maintainability.

## Directory Structure

```
test/e2e/
├── resolvers/
│   ├── app.resolver.e2e-spec.ts              # 3 tests
│   ├── auth.resolver.e2e-spec.ts             # 5 tests
│   ├── user.resolver.e2e-spec.ts             # 10 tests
│   ├── entity.resolver.e2e-spec.ts           # 3 tests
│   └── ai-query.resolver.e2e-spec.ts         # 4 tests
└── cross-cutting/
    ├── error-cases.e2e-spec.ts               # 12 tests
    ├── validation-edge-cases.e2e-spec.ts     # 5 tests
    ├── pagination-edge-cases.e2e-spec.ts     # 3 tests
    ├── partial-updates.e2e-spec.ts           # 2 tests
    └── relationship-edge-cases.e2e-spec.ts   # 2 tests
```

Additional Jest E2E suites live in `test/`:
- `app.e2e-spec.ts` (1 test)
- `db-setup-verification.e2e-spec.ts` (6 tests)

**Totals**: 12 test suites, 56 tests ✅

## Running Tests

- **All backend e2e**: `npm run test:e2e`
- **Single file**: `npm run test:e2e -- test/e2e/resolvers/user.resolver.e2e-spec.ts`
- **Cross-cutting only**: `npm run test:e2e -- test/e2e/cross-cutting/error-cases.e2e-spec.ts`

## Notes

- Some Prisma/Nest log errors during runs are **expected**: we intentionally test constraint violations and validation paths.
