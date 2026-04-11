# ADR-003: Frontend Testing Strategy

## Status
Status: ACCEPTED

## Date
2026-01-12

## Context

Aletheia’s frontend supports:
- Document ingestion and indexing
- Entity extraction and relationships
- Graph-based navigation of truth claims
- Wizard-driven onboarding flows

The complexity of user flows requires a **layered testing strategy** that balances speed, confidence, and maintainability.

Historically, the test suite relied heavily on Jest-based unit tests, with Playwright added later for E2E validation. The current implementation uses Vitest for unit/integration tests and Playwright for E2E. This ADR formalizes testing responsibilities and boundaries.

## Decision

We adopt a **three-layer frontend testing strategy**:

1. **Unit & Component Tests (Vitest)**
2. **Integration Tests via MSW (Vitest)**
3. **End-to-End Tests (Playwright)**

Snapshot testing is explicitly discouraged except for low-level, stable primitives.

## Testing Layers Defined

### 1. Unit & Component Tests (Vitest)

**Scope**
- Presentational components
- Stateful components
- Hooks
- Utility functions

**Characteristics**
- Fast
- Deterministic
- No real network or browser APIs

**Tools**
- Vitest
- React Testing Library
- @testing-library/user-event

**Examples**
- DocumentCard renders provenance metadata
- Entity labels render source attribution without confidence or scoring (ADR-006)
- useDocumentUpload validates file type

---

### 2. Integration Tests (Vitest + MSW)

**Scope**
- Components interacting with GraphQL
- Wizard steps with backend assumptions
- State coordination across components

**Characteristics**
- Network mocked via MSW
- Tests GraphQL contracts
- Focused on behavior, not implementation

**Tools**
- Vitest
- MSW
- Apollo Client test utilities

**Examples**
- Document index loads with correct source type
- Entity relationships render evidence summaries
- Wizard advances based on backend responses

---

### 3. End-to-End Tests (Playwright)

**Scope**
- Full user journeys
- Browser behavior
- Authentication boundaries
- Cross-page navigation

**Characteristics**
- Slower
- Highest confidence
- Minimal mocking

**Tools**
- Playwright

**Examples**
- User uploads documents and completes indexing
- User explores entity graph
- User completes onboarding wizard

---

## Non-Goals

- No testing of Next.js internals
- No duplication of Playwright flows in unit tests
- No snapshot-driven UI validation

## Consequences

### Positive
- Clear testing ownership per layer
- Faster CI feedback
- Reduced flaky tests
- Better alignment with user intent

### Negative
- Requires discipline to avoid over-testing
- Requires well-maintained MSW handlers

## Enforcement

- CI will fail if:
  - Coverage drops below agreed thresholds
  - Playwright critical paths fail
- New features must include:
  - Unit/component coverage
  - Integration coverage where GraphQL is involved

## Decision Outcome

Implemented. Vitest is used for unit/integration tests and Playwright is used for E2E, with the three-layer strategy enforced in CI.
