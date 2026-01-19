# ADR-002: Frontend Build and Test Tooling

## Status
Proposed

## Date
2026-01-XX

## Context

The Aletheia frontend is currently implemented as a **Next.js application** with a **Jest-based unit testing setup**, Playwright for E2E tests, and a growing shared component library. While Jest is functional, it introduces:

- Slower test startup and execution times
- Higher configuration overhead (Babel/SWC/JSDOM alignment)
- Duplication between build tooling (Next/SWC) and test tooling (Jest)

The project roadmap emphasizes:
- Fast developer feedback loops
- High test coverage at the component and hook level
- Long-term maintainability and clarity of tooling responsibilities

The modern React ecosystem increasingly favors **Vite + Vitest** for unit and component testing due to performance and native ESM alignment.

## Decision

We will adopt the following tooling strategy:

- **Next.js remains the production build framework**
- **Vite is introduced for local test bundling only**
- **Vitest replaces Jest for unit and component tests**
- **Playwright remains the E2E testing solution**

Jest will be fully removed once parity is achieved.

## Rationale

### Why Vitest
- Near-instant startup via Vite’s native ESM graph
- Jest-compatible API (`describe`, `it`, `expect`)
- First-class TypeScript support
- Built-in mocking, spies, and coverage
- Tight integration with Testing Library and MSW

### Why Not Replace Next.js
- Next.js provides routing, SSR, App Router, and production optimizations
- Vite does not replace these capabilities
- Using Vite **only for testing** avoids unnecessary architectural churn

### Testing Layer Responsibilities

| Layer | Tool |
|-----|-----|
| Unit / Component | Vitest |
| Hooks / Utils | Vitest |
| GraphQL / MSW | Vitest |
| E2E / Flows | Playwright |
| Production Build | Next.js |

## Consequences

### Positive
- Faster test execution and feedback
- Reduced configuration complexity
- Modern, future-proof testing stack
- Easier onboarding for contributors familiar with Vite/Vitest

### Negative
- Migration cost from Jest
- Temporary duplication during transition
- Team learning curve

## Migration Notes (High-Level)

- Replace `jest` scripts with `vitest`
- Introduce `vitest.config.ts`
- Replace `jest.setup.ts` with `vitest.setup.ts`
- Convert Jest mocks to `vi.mock`
- Replace Jest globals with Vitest equivalents
- Maintain Playwright unchanged

## Decision Outcome

Adopted pending successful migration of existing test suite with no loss of coverage or confidence.
