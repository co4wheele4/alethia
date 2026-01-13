# Aletheia Test Suite

This directory contains all test files for the Aletheia monorepo.

## Structure

```
test/
├── e2e/                    # End-to-end tests
│   ├── backend/            # Backend-only e2e tests
│   │   ├── resolvers/      # GraphQL resolver tests
│   │   └── cross-cutting/  # Cross-cutting concerns tests
│   ├── integration/        # Full-stack integration tests (frontend + backend)
│   └── helpers/            # Shared test utilities and setup
│       ├── test-setup.ts   # Test application setup
│       ├── test-db.ts      # Database utilities
│       └── graphql-request.ts # GraphQL request helper
├── jest-e2e.json          # Jest configuration for e2e tests
└── README.md              # This file
```

## Running Tests

### From Root Level

```bash
# Run all tests (unit + e2e)
npm run test:all

# Run only unit tests (backend + frontend)
npm run test:unit

# Run only e2e tests
npm run test:e2e

# Run only backend e2e tests
npm run test:e2e:backend

# Run only integration e2e tests
npm run test:e2e:integration
```

### From Workspace Level

```bash
# Backend unit tests
cd aletheia-backend
npm run test

# Frontend unit tests
cd aletheia-frontend
npm run test
```

## Test Types

### Unit Tests

- **Backend**: Located in `aletheia-backend/src/**/*.spec.ts`
  - Tests individual services, resolvers, and modules in isolation
  - Uses mocks and test doubles
  - Fast execution

- **Frontend**: Located in `aletheia-frontend/app/__tests__/`
  - Tests React components and hooks
  - Uses React Testing Library
  - Mocks external dependencies (Apollo Client, etc.)

### E2E Tests

- **Backend E2E**: Located in `test/e2e/backend/`
  - Tests complete GraphQL API endpoints
  - Uses real database (test database)
  - Tests full request/response cycle

- **Integration E2E**: Located in `test/e2e/integration/`
  - Tests full-stack flows (frontend + backend)
  - Verifies complete user journeys
  - Tests API contracts between frontend and backend

## Test Environment

E2E tests require:
- PostgreSQL test database named `aletheia_test`
- Environment variables configured in `aletheia-backend/.env.test`
- Database migrations applied

The test setup automatically:
- Verifies test database is being used (safety check)
- Cleans database before each test suite
- Seeds test data
- Applies migrations

## Writing New Tests

### Backend E2E Test

```typescript
import { setupTestApp, teardownTestApp, TestContext } from '../helpers/test-setup';
import { graphqlRequest } from '../helpers/graphql-request';

describe('MyFeature (e2e)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await setupTestApp();
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('should do something', async () => {
    const query = `
      query MyQuery {
        myField
      }
    `;

    const res = await graphqlRequest(
      context.app,
      query,
      {},
      { authToken: context.auth.userToken },
    );

    expect(res.status).toBe(200);
    expect(res.body?.data?.myField).toBeDefined();
  });
});
```

### Frontend Unit Test

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Coverage

- Backend: Target 100% coverage (enforced in jest config)
- Frontend: Aim for high coverage of critical paths

View coverage reports:
- Backend: `aletheia-backend/coverage/`
- Frontend: `aletheia-frontend/coverage/`
- E2E: `coverage-e2e/`
