# E2E Test Organization

## Overview

Backend e2e tests are organized into a maintainable structure:
- **Resolvers** - Resolver-focused GraphQL suites
- **Cross-cutting** - Validation, error handling, pagination, and relationship behavior

## Current Structure (Verified)

```
test/
├── e2e/
│   ├── resolvers/
│   │   ├── app.resolver.e2e-spec.ts
│   │   ├── auth.resolver.e2e-spec.ts
│   │   ├── user.resolver.e2e-spec.ts
│   │   ├── entity.resolver.e2e-spec.ts
│   │   └── ai-query.resolver.e2e-spec.ts
│   ├── cross-cutting/
│   │   ├── error-cases.e2e-spec.ts
│   │   ├── validation-edge-cases.e2e-spec.ts
│   │   ├── pagination-edge-cases.e2e-spec.ts
│   │   ├── partial-updates.e2e-spec.ts
│   │   └── relationship-edge-cases.e2e-spec.ts
│   ├── README.md
│   ├── TEST_ORGANIZATION.md
│   ├── TEST_VERIFICATION_SUMMARY.md
│   ├── MIGRATION_SUMMARY.md
│   └── EXTRACTION_GUIDE.md
├── helpers/
│   ├── test-db.ts
│   ├── graphql-request.ts
│   └── test-setup.ts
├── app.e2e-spec.ts
└── db-setup-verification.e2e-spec.ts
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

- ✅ **Migration complete**: Resolver and cross-cutting suites are organized under `test/e2e/`
- ✅ **No monolithic file**: `graphql.e2e-spec.ts` is not part of this repo’s e2e suite

## Benefits

1. **Easy Navigation**: Find tests for a specific resolver quickly
2. **Clear Organization**: Tests grouped by logical concern
3. **Maintainability**: Smaller, focused test files
4. **Extensibility**: Clear place to add new tests
5. **Isolation**: Each test file has its own setup/teardown

