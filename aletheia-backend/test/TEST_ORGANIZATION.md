# E2E Test Organization

## Overview

The e2e tests have been reorganized into a logical, maintainable structure. Tests are now grouped by:
- **Resolvers** - Individual GraphQL resolver tests
- **Cross-cutting** - Tests that span multiple resolvers or test cross-cutting concerns
- **Coverage** - Tests specifically for code coverage

## New Structure

```
test/
├── e2e/
│   ├── resolvers/              # Individual resolver tests
│   │   ├── app.resolver.e2e-spec.ts ✅
│   │   ├── user.resolver.e2e-spec.ts ✅
│   │   ├── lesson.resolver.e2e-spec.ts ⬜
│   │   ├── document.resolver.e2e-spec.ts ⬜
│   │   ├── document-chunk.resolver.e2e-spec.ts ⬜
│   │   ├── embedding.resolver.e2e-spec.ts ⬜
│   │   ├── entity.resolver.e2e-spec.ts ⬜
│   │   ├── entity-mention.resolver.e2e-spec.ts ⬜
│   │   ├── entity-relationship.resolver.e2e-spec.ts ⬜
│   │   └── ai-query.resolver.e2e-spec.ts ⬜
│   ├── cross-cutting/          # Cross-cutting concern tests
│   │   ├── error-cases.e2e-spec.ts ⬜
│   │   ├── partial-updates.e2e-spec.ts ⬜
│   │   ├── validation-edge-cases.e2e-spec.ts ⬜
│   │   ├── relationship-edge-cases.e2e-spec.ts ⬜
│   │   ├── pagination-edge-cases.e2e-spec.ts ⬜
│   │   └── complex-nested-queries.e2e-spec.ts ⬜
│   ├── coverage/               # Coverage-specific tests
│   │   └── direct-resolver-testing.e2e-spec.ts ⬜
│   ├── README.md               # Usage guide
│   ├── EXTRACTION_GUIDE.md     # How to extract remaining tests
│   └── MIGRATION_SUMMARY.md    # Migration status
├── helpers/
│   ├── test-db.ts              # Database utilities
│   ├── graphql-request.ts      # GraphQL request helper ✅ NEW
│   └── test-setup.ts           # Test setup/teardown ✅ NEW
└── graphql.e2e-spec.ts         # Original monolithic file (to be removed after migration)
```

## Quick Start

### Adding a Test to a Resolver

1. Find the resolver file: `test/e2e/resolvers/{resolver-name}.resolver.e2e-spec.ts`
2. Add your test in the appropriate `describe` block:
   - `Queries` - for query operations
   - `Mutations` - for mutation operations  
   - `ResolveFields` - for field resolver tests

### Adding a Cross-Cutting Test

1. Determine the category (error cases, validation, relationships, etc.)
2. Add to the appropriate file in `test/e2e/cross-cutting/`

### Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific resolver tests
npm run test:e2e -- test/e2e/resolvers/user.resolver.e2e-spec.ts

# Run cross-cutting tests
npm run test:e2e -- test/e2e/cross-cutting/error-cases.e2e-spec.ts
```

## Test File Template

```typescript
import { setupTestApp, teardownTestApp, TestContext } from '../../helpers/test-setup';
import { graphqlRequest } from '../../helpers/graphql-request';

describe('ResolverName (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Queries', () => {
    it('should do something', async () => {
      const query = `query { ... }`;
      const res = await graphqlRequest(context.app, query);
      // assertions
    });
  });

  describe('Mutations', () => {
    it('should create something', async () => {
      const mutation = `mutation { ... }`;
      const res = await graphqlRequest(context.app, mutation, variables);
      // assertions
    });
  });
});
```

## Migration Status

- ✅ **Infrastructure**: Shared utilities and directory structure created
- ✅ **Examples**: App and User resolver tests extracted as examples
- ⬜ **Remaining**: 8 resolver tests, 6 cross-cutting tests, 1 coverage test

See `test/e2e/MIGRATION_SUMMARY.md` for detailed extraction instructions.

## Benefits

1. **Easy Navigation**: Find tests for a specific resolver quickly
2. **Clear Organization**: Tests grouped by logical concern
3. **Maintainability**: Smaller, focused test files
4. **Extensibility**: Clear place to add new tests
5. **Isolation**: Each test file has its own setup/teardown

