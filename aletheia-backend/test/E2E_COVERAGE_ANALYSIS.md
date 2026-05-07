# E2E Test Coverage Analysis (Backend)

**Last Updated**: May 6, 2026  
**Status:** Run `npm run test:e2e` from `aletheia-backend/` for current green status.

## Totals

Exact suite and test counts change with the codebase. As of **2026-05-06**, **`npx jest --config ./test/jest-e2e.json --listTests`** reports **17** spec files (resolvers, cross-cutting, bundle, DB, smoke, db-setup).

## Organization

- **Resolver-focused:** `test/e2e/resolvers/` (`app`, `auth`, `user`, `entity`, `html-crawl-ingestion`, `review-assignment`, …)
- **Cross-cutting:** `test/e2e/cross-cutting/` (errors, validation, **`documents(limit, offset)`** pagination, relationships, ADR-035 workspace, create-claim workspace)
- **Bundle / DB:** `test/e2e/bundle/`, `test/e2e/db/`
- **General:** `test/app.e2e-spec.ts`, `test/db-setup-verification.e2e-spec.ts`

**Removed:** `ai-query.resolver.e2e-spec.ts` and legacy **`askAI` / AI-query** persistence (**2026-05-06**).

## What “coverage” means here

Behavioral / API coverage (which GraphQL operations and edge cases are exercised end-to-end), not necessarily Jest line coverage percentages.

## Expected errors in logs

Some Prisma/Nest exceptions in logs are **expected** because tests intentionally verify `P2002`, `P2003`, validation failures, etc.

## How to run

```bash
cd aletheia-backend
npm run test:e2e
```
