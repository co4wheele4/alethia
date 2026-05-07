# E2E Test Organization Guide

**Last Updated**: May 6, 2026  
**Status**: Organized (migration complete)

Resolver-focused GraphQL suites live in **`test/e2e/resolvers/`**. Cross-cutting behavior (errors, validation, pagination, workspace, claim workspace) lives in **`test/e2e/cross-cutting/`**. Bundle and DB constraint suites live in **`test/e2e/bundle/`** and **`test/e2e/db/`**.

## Resolver-specific tests (`test/e2e/resolvers/`)

Current files include:

- `app.resolver.e2e-spec.ts`
- `auth.resolver.e2e-spec.ts`
- `user.resolver.e2e-spec.ts`
- `entity.resolver.e2e-spec.ts`
- `html-crawl-ingestion.resolver.e2e-spec.ts`
- `review-assignment.resolver.e2e-spec.ts`

**Removed:** `ai-query.resolver.e2e-spec.ts` (**2026-05-06**) together with legacy AI-query GraphQL and database tables.

## Cross-cutting tests (`test/e2e/cross-cutting/`)

- `error-cases.e2e-spec.ts` — constraint violations, FK errors, not-found paths
- `validation-edge-cases.e2e-spec.ts` — null/empty inputs, long strings, edge cases
- `pagination-edge-cases.e2e-spec.ts` — `documents(limit, offset)` boundaries
- `partial-updates.e2e-spec.ts` — partial update behavior
- `relationship-edge-cases.e2e-spec.ts` — cascade / dependency behavior
- `workspace-isolation-adr035.e2e-spec.ts` — ADR-035 scoping
- `create-claim-workspace.e2e-spec.ts` — draft claim visibility

## Notes

- The monolithic `graphql.e2e-spec.ts` file is **not** part of this suite.
