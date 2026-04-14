# ADR-029: Epistemic Observability (Structural Only)

## Status

Status: ACCEPTED

## Date

2026-04-09

---

## Context

Operators and auditors need visibility into **governance-relevant events** (for example GraphQL errors tagged for policy review) without turning observability into a semantic layer. The system should log **structural** events that support audits and incident response.

---

## Decision

Aletheia SHALL persist **epistemic events** in a dedicated store and expose an **admin-only** read API for filtered listing.

- Event types are enumerated (`EpistemicEventType`); initial scope is structural (e.g. governance-related GraphQL errors).
- Payloads use explicit metadata (`JSON`) suitable for audit; they MUST NOT encode confidence, rankings, or interpretive conclusions.

An interceptor MAY attach logging on relevant GraphQL paths; implementation details remain in code, but the ADR fixes the **non-semantic** character of the stream.

---

## Rules

1. **Admin gate** — `adminEpistemicEvents` requires administrative authorization.
2. **No product “truth” API** — This stream is not a substitute for adjudication logs or evidence content; it is operational and governance telemetry.
3. **Export opt-in** — Bundle export may include epistemic events only when explicitly requested (ADR-031).

---

## Implementation (repository)

- Persistence: shared migration with ADR-026 (`aletheia-backend/prisma/migrations/20260409170000_adr026_adr029_structural_extensions/`)
- Logging: `aletheia-backend/src/observability/logEpistemicEvent.ts`
- Interceptor: `aletheia-backend/src/observability/epistemic-audit.interceptor.ts`
- GraphQL: `aletheia-backend/src/graphql/resolvers/epistemic-events.resolver.ts`
- Frontend (admin UI): `aletheia-frontend/app/admin/epistemic-events/` (route `/admin/epistemic-events`)

---

## Relationship to Other ADRs

- **ADR-025** — Agents may emit audit outputs; human-facing dashboards remain non-interpretive.
- **ADR-031** — Optional inclusion of epistemic rows in export bundles.

---

## Consequences

### Positive

- Central place to query governance-tagged events for compliance and debugging.

### Negative

- Storage growth and PII/ops handling considerations for metadata; filters should stay structural.
