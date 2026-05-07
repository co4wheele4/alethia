# E2E Test Organization Verification Summary

**Date**: May 6, 2026  
**Status**: ✅ **Organized and Verified** (rerun `npm run test:e2e:backend` after changes)

## Summary

Backend e2e tests are fully organized under `test/e2e/backend/` (resolvers + cross-cutting). No monolithic `graphql.e2e-spec.ts` file is used.

## Current File Inventory (Verified)

### Resolver-Specific (`test/e2e/backend/resolvers/`)

| File | Tests | Notes |
|------|-------|-------|
| `app.resolver.e2e-spec.ts` | 3 | App resolver queries/mutations |
| `auth.resolver.e2e-spec.ts` | 5 | Auth flows (login/register/guards) |
| `user.resolver.e2e-spec.ts` | 10 | User CRUD + resolve fields |
| `entity.resolver.e2e-spec.ts` | 3 | Entity resolve fields |

### Cross-Cutting (`test/e2e/backend/cross-cutting/`)

| File | Tests | Notes |
|------|-------|-------|
| `error-cases.e2e-spec.ts` | 12 | Constraints, FK violations, not-found paths |
| `validation-edge-cases.e2e-spec.ts` | 5 | Validation and boundary inputs |
| `pagination-edge-cases.e2e-spec.ts` | 3 | `documents(limit, offset)` edge values |
| `partial-updates.e2e-spec.ts` | 2 | Partial update behavior |
| `relationship-edge-cases.e2e-spec.ts` | 2 | Cascade/dependency behavior |

## Verification Result

`ai-query.resolver.e2e-spec.ts` was **removed** with legacy **`askAI` / AI-query** APIs (**2026-05-06**). Current totals:

```
npm run test:e2e:backend
```

(expect **9** resolver+cross-cutting suites under `test/e2e/backend/` plus integration specs per root `test/jest-e2e.json`).
