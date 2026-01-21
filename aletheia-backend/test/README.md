# End-to-End Tests

This directory contains end-to-end (e2e) tests for the Aletheia backend.

## Setup

1. **Create a test database**: Set up a separate PostgreSQL database for testing (e.g., `aletheia_test`)

2. **Configure test environment**: Create a `.env.test` file in the root directory with:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/aletheia_test"
   ```

3. **Run database migrations**: 
   ```bash
   npm run test:e2e:setup
   ```
   Or manually (equivalent):
   ```bash
   npx dotenv-cli -e .env.test -- npx prisma migrate deploy
   ```

## Running Tests

- **Run all e2e tests**: `npm run test:e2e`
- **Setup test database**: `npm run test:e2e:setup`
- **Reset test database**: `npm run test:e2e:reset`
- **Seed test database**: `npm run test:e2e:seed`
- **Full setup and test**: `npm run test:e2e:full`

## Test Structure

- `app.e2e-spec.ts` - REST endpoint smoke tests
- `db-setup-verification.e2e-spec.ts` - Safety checks (ensures `aletheia_test` is used, migrations applied, etc.)
- `e2e/` - Organized GraphQL e2e tests:
  - `e2e/resolvers/` - Resolver-focused suites
  - `e2e/cross-cutting/` - Validation/error/relationship/pagination suites
- `helpers/test-db.ts` - Database helper functions for cleaning and seeding
- `setup-e2e.ts` - Test environment setup

## Notes

- Tests automatically clean the database before running
- Each test suite seeds its own test data
- The database is cleaned after all tests complete

