# E2E Test Organization

This directory contains all end-to-end tests organized by logical grouping for easy maintenance and navigation.

## Directory Structure

```
test/e2e/
├── resolvers/          # Tests for individual GraphQL resolvers
│   ├── app.resolver.e2e-spec.ts
│   ├── user.resolver.e2e-spec.ts
│   ├── lesson.resolver.e2e-spec.ts
│   ├── document.resolver.e2e-spec.ts
│   ├── document-chunk.resolver.e2e-spec.ts
│   ├── embedding.resolver.e2e-spec.ts
│   ├── entity.resolver.e2e-spec.ts
│   ├── entity-mention.resolver.e2e-spec.ts
│   ├── entity-relationship.resolver.e2e-spec.ts
│   └── ai-query.resolver.e2e-spec.ts
├── cross-cutting/      # Tests that span multiple resolvers or test cross-cutting concerns
│   ├── error-cases.e2e-spec.ts
│   ├── validation-edge-cases.e2e-spec.ts
│   ├── relationship-edge-cases.e2e-spec.ts
│   ├── pagination-edge-cases.e2e-spec.ts
│   ├── complex-nested-queries.e2e-spec.ts
│   └── partial-updates.e2e-spec.ts
└── coverage/           # Tests specifically for code coverage
    └── direct-resolver-testing.e2e-spec.ts
```

## Adding New Tests

### Adding Tests for a Resolver

1. **Find the resolver test file**: `test/e2e/resolvers/{resolver-name}.resolver.e2e-spec.ts`
2. **Add your test** in the appropriate `describe` block:
   - `Queries` - for query operations
   - `Mutations` - for mutation operations
   - `ResolveFields` - for field resolver tests

Example:
```typescript
describe('MyResolver (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  describe('Queries', () => {
    it('should do something', async () => {
      // Your test here
    });
  });
});
```

### Adding Cross-Cutting Tests

1. **Determine the category**:
   - `error-cases.e2e-spec.ts` - Error handling and edge cases
   - `validation-edge-cases.e2e-spec.ts` - Input validation tests
   - `relationship-edge-cases.e2e-spec.ts` - Relationship/foreign key tests
   - `pagination-edge-cases.e2e-spec.ts` - Pagination tests
   - `complex-nested-queries.e2e-spec.ts` - Complex query scenarios
   - `partial-updates.e2e-spec.ts` - Partial update operations

2. **Add your test** to the appropriate file

### Test Utilities

All test files use shared utilities from `test/helpers/`:

- `test-setup.ts` - `setupTestApp()`, `teardownTestApp()`, `TestContext`
- `graphql-request.ts` - `graphqlRequest()` function
- `test-db.ts` - `cleanDatabase()`, `seedTestData()`

## Test Structure

Each test file follows this pattern:

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

  // Test cases here
});
```

## Running Tests

- Run all e2e tests: `npm run test:e2e`
- Run specific resolver tests: `npm run test:e2e -- test/e2e/resolvers/user.resolver.e2e-spec.ts`
- Run cross-cutting tests: `npm run test:e2e -- test/e2e/cross-cutting/error-cases.e2e-spec.ts`

