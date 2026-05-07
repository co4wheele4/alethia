# E2E Test Organization Verification Summary

**Date**: May 6, 2026  
**Status**: Organized — verify with `npm run test:e2e` from `aletheia-backend/`

## Summary

Backend e2e tests live under **`aletheia-backend/test/`**, primarily in **`test/e2e/`**, plus `test/app.e2e-spec.ts` and `test/db-setup-verification.e2e-spec.ts`. Jest loads them via **`./test/jest-e2e.json`**.

## Resolver-focused (`test/e2e/resolvers/`)

| File | Notes |
|------|-------|
| `app.resolver.e2e-spec.ts` | App queries |
| `auth.resolver.e2e-spec.ts` | Login / register / guards |
| `user.resolver.e2e-spec.ts` | User CRUD + resolve fields |
| `entity.resolver.e2e-spec.ts` | Entity resolve fields |
| `html-crawl-ingestion.resolver.e2e-spec.ts` | HTML crawl ingestion |
| `review-assignment.resolver.e2e-spec.ts` | Review assignments |

**Removed:** `ai-query.resolver.e2e-spec.ts` (**2026-05-06**).

## Cross-cutting (`test/e2e/cross-cutting/`)

| File | Notes |
|------|-------|
| `error-cases.e2e-spec.ts` | Constraints, FK violations, not-found |
| `validation-edge-cases.e2e-spec.ts` | Validation boundaries |
| `pagination-edge-cases.e2e-spec.ts` | `documents(limit, offset)` |
| `partial-updates.e2e-spec.ts` | Partial updates |
| `relationship-edge-cases.e2e-spec.ts` | Cascade behavior |
| `workspace-isolation-adr035.e2e-spec.ts` | ADR-035 |
| `create-claim-workspace.e2e-spec.ts` | Claim workspace |

## Other (`test/`)

| File | Notes |
|------|-------|
| `app.e2e-spec.ts` | HTTP smoke |
| `db-setup-verification.e2e-spec.ts` | DB safety / setup |

## Bundle / DB (`test/e2e/`)

- `bundle/bundle-import-adr027.e2e-spec.ts`
- `db/adr027-epistemic-constraints.e2e-spec.ts`

## Verification

Run:

```bash
cd aletheia-backend
npx jest --config ./test/jest-e2e.json --listTests
npm run test:e2e
```
