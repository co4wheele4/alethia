# ADR-001: Frontend Architecture for Aletheia

## Status
Accepted

## Date
January 2026

## Context
Aletheia is a truth-discovery and knowledge-extraction platform built on a production-ready NestJS + GraphQL backend with Prisma and PostgreSQL. The backend exposes a rich domain model (Documents, Chunks, Entities, Relationships, AI Queries) and is designed for extensibility, provenance, and explainability.

The frontend must:
- Support complex, graph-oriented data exploration
- Emphasize transparency, provenance, and evidence
- Scale with future AI-assisted workflows
- Remain maintainable, testable, and performant

This ADR documents the architectural decisions for the frontend application.

---

## Decision

The frontend will be implemented as a **React + TypeScript application using Next.js (App Router)**, consuming the backend via **Apollo Client and GraphQL**.

The architecture will emphasize:
- Component-driven UI
- Explicit data contracts
- Progressive disclosure of complexity
- Strong typing and testability

---

## Chosen Stack

### Core Framework
- **React 18** – Component-based UI with hooks
- **Next.js (App Router)** – Routing, SSR/SSG, layouts, and edge-readiness
- **TypeScript (strict mode)** – Type safety and maintainability

### Data Layer
- **Apollo Client** – GraphQL queries, mutations, caching, and normalization
- **Codegen (graphql-codegen)** – Typed hooks and contracts
- **GraphQL Fragments** – Reusable, explicit data shapes

### UI & Styling
- **Material UI (MUI v5)** – Consistent design system
- **Theme-based styling** – Light/dark modes and brand alignment
- **Custom layout primitives** – Panels, split views, inspectors

### State Management
- **Apollo Cache** – Server state
- **Local React State / useReducer** – UI state
- **URL State (search params)** – Shareable navigation state

### Testing
- **React Testing Library** – Unit/component tests
- **Playwright or Cypress** – E2E tests
- **MSW (Mock Service Worker)** – GraphQL mocking

---

## Architectural Principles

### 1. GraphQL as the Source of Truth
- No REST fallbacks
- No duplicated client-side models
- All domain data flows from GraphQL contracts

### 2. Evidence-First UX
- Every claim, entity, or relationship must be traceable
- UI must surface provenance, source documents, and confidence
- Avoid black-box AI outputs

### 3. Progressive Disclosure
- Simple entry points for new users
- Advanced tools revealed contextually
- Wizard-driven onboarding for document ingestion

### 4. Component-Level Ownership
- Each feature owns its components, queries, and tests
- Co-locate UI + GraphQL + tests

### 5. Performance by Design
- Avoid over-fetching via fragments
- Use pagination and lazy queries
- Memoize derived data intentionally

---

## High-Level Frontend Architecture

```
app/
├── layout.tsx           # Root layout
├── page.tsx             # Landing / dashboard
├── documents/           # Document-centric flows
│   ├── page.tsx
│   ├── components/
│   └── graphql/
├── entities/            # Entity graph exploration
├── queries/             # AI queries and results
├── wizard/              # Onboarding & setup
├── components/          # Shared UI components
├── graphql/             # Shared fragments & schema
├── lib/                 # Apollo client, utilities
└── theme/               # MUI theme configuration
```

---

## Key UX Flows Supported

1. **Document Ingestion**
   - Upload or paste documents
   - View chunking and processing state
   - Inspect extracted entities and relationships

2. **Knowledge Exploration**
   - Entity-centric views
   - Relationship graphs
   - Evidence-backed navigation

3. **AI-Assisted Queries**
   - Natural language questions
   - Ranked, scored answers
   - Traceable supporting evidence

4. **Onboarding Wizard**
   - Guided setup for new users
   - Sample data option
   - Clear mental model of the system

---

## Alternatives Considered

### 1. REST + Redux
**Rejected**
- Duplicates backend models
- Higher maintenance cost
- Poor fit for graph-shaped data

### 2. Micro-Frontend Architecture
**Deferred**
- Premature complexity
- Not justified at current scale

### 3. Server-Only Rendering
**Rejected**
- Interactive graph exploration requires client-side interactivity

---

## Consequences

### Positive
- Strong alignment with backend GraphQL design
- Excellent developer experience
- Scales with complexity
- Clear provenance and explainability

### Trade-offs
- Requires GraphQL expertise
- Initial setup complexity
- More discipline around query design

---

## Future Considerations

- Apollo Federation / Supergraph support
- Real-time subscriptions for processing updates
- Web Workers for heavy client-side computation
- Visualization libraries (e.g., D3, Cytoscape)

---

## Conclusion

This frontend architecture supports Aletheia’s core mission: **truth through transparency**. By aligning tightly with the GraphQL backend and emphasizing evidence, provenance, and clarity, the frontend becomes a first-class participant in knowledge discovery rather than a passive display layer.
