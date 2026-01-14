# E2E Test Organization Guide

**Last Updated**: January 14, 2026  
**Status**: ✅ Organized (migration complete)

This document outlines where backend e2e tests should live for maintainability and clarity.

## Organization Rules

### Resolver-Specific Tests (`test/e2e/backend/resolvers/`)

Put tests that primarily exercise a single resolver (queries, mutations, resolve fields) into a dedicated resolver file.

Current resolver files:
- `app.resolver.e2e-spec.ts` (3 tests)
- `auth.resolver.e2e-spec.ts` (5 tests)
- `user.resolver.e2e-spec.ts` (10 tests)
- `entity.resolver.e2e-spec.ts` (3 tests)
- `ai-query.resolver.e2e-spec.ts` (4 tests)

### Cross-Cutting Tests (`test/e2e/backend/cross-cutting/`)

Put tests that validate shared behavior across many resolvers into cross-cutting files:
- `error-cases.e2e-spec.ts` (12 tests): constraint violations, foreign key errors, not-found paths
- `validation-edge-cases.e2e-spec.ts` (5 tests): null/empty inputs, long strings, array edge cases
- `pagination-edge-cases.e2e-spec.ts` (3 tests): skip/take boundaries
- `partial-updates.e2e-spec.ts` (2 tests): partial update behavior
- `relationship-edge-cases.e2e-spec.ts` (2 tests): cascade/dependency behavior

## Notes

- The monolithic `graphql.e2e-spec.ts` file is **not used** (migration is complete).
