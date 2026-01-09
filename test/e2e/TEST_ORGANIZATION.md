# E2E Test Organization Guide

This document outlines where tests should be located for maintainability and clarity.

## Current Status

### ✅ Properly Organized
- `test/e2e/resolvers/app.resolver.e2e-spec.ts` - App resolver tests
- `test/e2e/resolvers/user.resolver.e2e-spec.ts` - User resolver tests
- `test/e2e/cross-cutting/additional-edge-cases.e2e-spec.ts` - **NEEDS REORGANIZATION**

### ⚠️ Needs Organization
- `test/graphql.e2e-spec.ts` - Monolithic file with all tests (migration in progress)
- `test/e2e/cross-cutting/additional-edge-cases.e2e-spec.ts` - Contains tests that should be split

## Test File Organization Rules

### Resolver-Specific Tests (`test/e2e/resolvers/`)
Each resolver should have its own file: `{resolver-name}.resolver.e2e-spec.ts`

**Contains:**
- Queries specific to that resolver
- Mutations specific to that resolver
- ResolveFields specific to that resolver
- Error cases specific to that resolver's operations

**Examples:**
- `entity.resolver.e2e-spec.ts` - All Entity resolver tests including mentions, outgoing, incoming ResolveFields
- `ai-query.resolver.e2e-spec.ts` - All AiQuery and AiQueryResult resolver tests

### Cross-Cutting Tests (`test/e2e/cross-cutting/`)

#### `error-cases.e2e-spec.ts`
- Constraint violations (duplicate email, duplicate entity, etc.)
- Foreign key constraint violations
- Invalid ID formats
- SQL injection attempts
- Non-existent record errors

#### `validation-edge-cases.e2e-spec.ts`
- Empty string inputs
- Very long string inputs
- Null optional parameters
- Invalid data types
- Array edge cases (empty arrays, very large arrays)

#### `relationship-edge-cases.e2e-spec.ts`
- Delete cascade scenarios
- Relationship integrity tests
- Foreign key relationships
- Circular relationship tests

#### `pagination-edge-cases.e2e-spec.ts`
- Pagination with skip=0, take=0
- Very large skip values
- Very large take values
- Negative values
- Skip > total records

#### `partial-updates.e2e-spec.ts`
- Update with all fields null
- Update with empty strings
- Partial field updates
- Update non-existent records

#### `complex-nested-queries.e2e-spec.ts`
- Deep nested queries (3+ levels)
- Multiple relationship traversals
- Complex query combinations

## Reorganization Plan for `additional-edge-cases.e2e-spec.ts`

### Move to Resolver Files:
1. **Entity ResolveFields - Direct Tests** → `entity.resolver.e2e-spec.ts`
2. **AiQuery ResolveFields - Direct Tests** → `ai-query.resolver.e2e-spec.ts`
3. **AiQueryResult Direct Query Test** → `ai-query.resolver.e2e-spec.ts`

### Move to Cross-Cutting Files:
1. **Constraint Violation Tests** → `error-cases.e2e-spec.ts`
2. **Foreign Key Constraint Tests** → `error-cases.e2e-spec.ts`
3. **Empty and Null Input Edge Cases** → `validation-edge-cases.e2e-spec.ts`
4. **Embedding Array Edge Cases** → `validation-edge-cases.e2e-spec.ts`
5. **Pagination Edge Cases** → `pagination-edge-cases.e2e-spec.ts`
6. **Update Operations Edge Cases** → `partial-updates.e2e-spec.ts`
7. **Query Edge Cases** → `error-cases.e2e-spec.ts`
8. **Delete Cascade Tests** → `relationship-edge-cases.e2e-spec.ts`

## Migration Status

- [x] App resolver tests extracted
- [x] User resolver tests extracted
- [ ] Entity resolver tests extracted
- [ ] AiQuery resolver tests extracted
- [ ] Lesson resolver tests extracted
- [ ] Document resolver tests extracted
- [ ] DocumentChunk resolver tests extracted
- [ ] Embedding resolver tests extracted
- [ ] EntityMention resolver tests extracted
- [ ] EntityRelationship resolver tests extracted
- [ ] Cross-cutting test files created
- [ ] Tests from `additional-edge-cases.e2e-spec.ts` reorganized

