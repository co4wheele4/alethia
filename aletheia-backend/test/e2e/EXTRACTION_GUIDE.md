# Test Extraction Guide

This guide documents how to extract tests from the monolithic `graphql.e2e-spec.ts` file.

## Line Ranges for Each Section

Based on analysis of `test/graphql.e2e-spec.ts`:

1. **App Resolver**: Lines 70-116
2. **User Resolver**: Lines 117-353
3. **Lesson Resolver**: Lines 354-522
4. **Document Resolver**: Lines 523-707
5. **Document Chunk Resolver**: Lines 708-914
6. **Embedding Resolver**: Lines 915-1101
7. **Entity Resolver**: Lines 1102-1293
8. **Entity Mention Resolver**: Lines 1294-1543
9. **Entity Relationship Resolver**: Lines 1544-1791
10. **AI Query Resolver**: Lines 1792-2059
11. **Error Cases**: Lines 2060-2644
12. **Partial Update Tests**: Lines 2645-2854
13. **Validation Edge Cases**: Lines 2855-2983
14. **Relationship Edge Cases**: Lines 2984-3250
15. **Pagination Edge Cases**: Lines 3251-3365
16. **Complex Nested Queries**: Lines 3366-3641
17. **Direct Resolver Testing**: Lines 3642-end

## Extraction Pattern

For each section:

1. Copy the `describe` block content
2. Replace `app` with `context.app`
3. Replace `testData` with `context.testData`
4. Replace `prisma` with `context.prisma` (if used)
5. Add imports:
   ```typescript
   import { setupTestApp, teardownTestApp, TestContext } from '../../helpers/test-setup';
   import { graphqlRequest } from '../../helpers/graphql-request';
   ```
6. Add setup/teardown:
   ```typescript
   let context: TestContext;
   
   beforeAll(async () => {
     context = await setupTestApp();
   });
   
   afterAll(async () => {
     await teardownTestApp(context);
   });
   ```

## Files to Create

### Resolvers (`test/e2e/resolvers/`)
- ✅ `app.resolver.e2e-spec.ts`
- ✅ `user.resolver.e2e-spec.ts`
- ⬜ `lesson.resolver.e2e-spec.ts`
- ⬜ `document.resolver.e2e-spec.ts`
- ⬜ `document-chunk.resolver.e2e-spec.ts`
- ⬜ `embedding.resolver.e2e-spec.ts`
- ⬜ `entity.resolver.e2e-spec.ts`
- ⬜ `entity-mention.resolver.e2e-spec.ts`
- ⬜ `entity-relationship.resolver.e2e-spec.ts`
- ⬜ `ai-query.resolver.e2e-spec.ts`

### Cross-Cutting (`test/e2e/cross-cutting/`)
- ⬜ `error-cases.e2e-spec.ts`
- ⬜ `partial-updates.e2e-spec.ts`
- ⬜ `validation-edge-cases.e2e-spec.ts`
- ⬜ `relationship-edge-cases.e2e-spec.ts`
- ⬜ `pagination-edge-cases.e2e-spec.ts`
- ⬜ `complex-nested-queries.e2e-spec.ts`

### Coverage (`test/e2e/coverage/`)
- ⬜ `direct-resolver-testing.e2e-spec.ts`

