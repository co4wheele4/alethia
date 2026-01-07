# Testing Guidelines

## Overview
This document outlines testing requirements and best practices for the Aletheia backend project.

## Test Types

### Unit Tests (`*.spec.ts`)
- **Location**: Co-located with source files in `src/`
- **Coverage**: Must maintain 90%+ coverage
- **Run**: `npm run test` or `npm run test:cov`

### E2E Tests (`*.e2e-spec.ts`)
- **Location**: `test/` directory
- **Purpose**: Test full integration flows through HTTP/GraphQL
- **Run**: `npm run test:e2e` or `npm run test:e2e:cov`

## When to Add E2E Tests

### ✅ Always Add E2E Tests For:
1. **New GraphQL Resolvers/Mutations**
   - Test the full request/response cycle
   - Test error cases
   - Test authentication/authorization if applicable

2. **New API Endpoints**
   - Test HTTP requests/responses
   - Test query parameters, body parsing
   - Test status codes

3. **Complex Business Logic Flows**
   - Multi-step operations
   - Cross-service interactions
   - State-dependent operations

4. **Critical User Journeys**
   - User registration/login
   - Data creation workflows
   - Search/query operations

### ⚠️ Consider E2E Tests For:
- Database migrations that affect behavior
- Integration with external services
- Performance-critical paths
- Security-sensitive operations

### ❌ Not Required For:
- Pure utility functions (use unit tests)
- Internal helper methods
- Type definitions/interfaces

## E2E Test Checklist

When adding new features, ensure your PR includes:

- [ ] Unit tests for business logic (`*.spec.ts`)
- [ ] E2E tests for HTTP/GraphQL endpoints (`*.e2e-spec.ts`)
- [ ] Tests cover happy paths
- [ ] Tests cover error cases
- [ ] Tests verify data integrity
- [ ] Tests clean up test data

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run e2e tests with setup
npm run test:e2e:full

# Run e2e tests with coverage
npm run test:e2e:cov
```

## Test Structure

### E2E Test Template
```typescript
describe('FeatureName (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('Happy Path', () => {
    it('should perform successful operation', async () => {
      // Test implementation
    });
  });

  describe('Error Cases', () => {
    it('should handle errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

## Code Review

During code review, verify:
1. New resolvers/endpoints have corresponding e2e tests
2. Tests follow naming conventions (`*.e2e-spec.ts`)
3. Tests are placed in the `test/` directory
4. Tests clean up database state
5. Tests use proper test data helpers

## Coverage Goals

- **Unit Tests**: 90%+ coverage (enforced by Jest thresholds)
- **E2E Tests**: Focus on critical paths and integration flows
- **Note**: E2E coverage tracking has limitations - prioritize meaningful test coverage over metrics

