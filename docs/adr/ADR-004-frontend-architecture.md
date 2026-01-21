# ADR-004: Frontend Architecture Overview

## Status
Proposed

## Date
2026-01-XX

## Context

The Aletheia frontend is a **knowledge exploration and truth-disclosure interface** centered around documents, entities, relationships, and evidence. The system must support:

- Incremental document ingestion
- Provenance-aware entity extraction
- Evidence-backed relationships
- Wizard-driven onboarding
- Scalable UI complexity without architectural erosion

The frontend must remain:
- Modular
- Testable
- Evolvable as backend guarantees increase

## Architectural Principles

1. **Feature-Oriented Structure**
   - Organize by domain capability, not by technical layer alone
   - Features own their UI, hooks, GraphQL fragments, and tests

2. **Explicit Data Contracts**
   - All data flows originate from GraphQL contracts
   - UI does not infer backend meaning implicitly

3. **Composition Over Inheritance**
   - UI is composed of primitives and feature components
   - No deep component hierarchies

4. **Testability as a First-Class Constraint**
   - Every feature must be testable at unit and integration levels
   - Architecture must enable MSW-based contract testing

## High-Level Structure

src/
├── app/ # Next.js App Router
├── features/
│ ├── documents/
│ ├── entities/
│ ├── relationships/
│ ├── wizard/
│ └── search/
├── components/
│ ├── primitives/
│ └── layout/
├── graphql/
│ ├── queries/
│ ├── mutations/
│ └── fragments/
├── hooks/
├── state/
├── styles/
├── test/
│ ├── msw/
│ └── setup/

## Core Domains

### Documents
- Upload
- Source type classification
- Provenance metadata
- Indexing lifecycle

### Entities
- Mentions with offsets
- Confidence scoring
- Cross-document references

### Relationships
- Typed relationships
- Evidence-backed assertions
- Confidence aggregation

### Wizard
- Guided onboarding
- Progressive disclosure
- Backend-aware validation

## Data Flow

User Action
→ UI Component
→ Feature Hook
→ GraphQL Query/Mutation
→ Typed Response
→ Rendered View


No component accesses raw Apollo cache directly.

## State Management

- Apollo Client: server state
- Local component state: UI-only concerns
- No global client state store unless proven necessary

## Testing Alignment

This architecture explicitly supports ADR-002 and ADR-003:
- Vitest for unit/integration
- MSW for contract validation
- Playwright for end-to-end confidence

## Consequences

### Positive
- Predictable scaling
- Clear feature ownership
- Reduced coupling
- Strong test guarantees

### Negative
- Slightly higher upfront structure cost
- Requires discipline to maintain boundaries

## Decision Outcome

Adopted as the guiding frontend architecture for Aletheia.
