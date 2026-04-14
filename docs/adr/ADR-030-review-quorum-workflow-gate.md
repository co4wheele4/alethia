# ADR-030: Quorum-Based Review Workflow Gate (Non-Adjudicative)

## Status

Status: ACCEPTED

## Date

2026-04-09

---

## Context

Review coordination (ADR-015, ADR-016) records acknowledgements and declines but does not determine claim truth. Some deployments still want a **mechanical precondition** before terminal adjudication: enough reviewers must have **acknowledged** assignments so that adjudication does not run “cold.”

This gate MUST remain **non-semantic**: it counts coordination responses, not evidence quality or claim correctness.

---

## Decision

When enabled via configuration (`REVIEW_QUORUM_ENABLED`, optional `REVIEW_QUORUM_COUNT`), the adjudication path SHALL reject transitions to **ACCEPTED** or **REJECTED** unless the quorum requirement is met.

- The API exposes `reviewQuorumStatus(claimId)` with `enabled`, `requiredCount`, and `acknowledgedCount` (mechanical counts).
- The frontend MAY display quorum status on claim review as a **gate explanation**, not a recommendation or verdict.

---

## Rules

1. **Not adjudication** — Quorum does not accept or reject claims; it only blocks terminal adjudication until counts satisfy policy.
2. **Configurable** — When disabled, behavior matches prior adjudication rules (subject to ADR-011/023/018).
3. **Error surface** — Failed quorum checks use an explicit GraphQL error code (e.g. `REVIEW_QUORUM_NOT_MET`) for clients to handle deterministically.

---

## Implementation (repository)

- Resolver logic: `aletheia-backend/src/graphql/resolvers/claim-adjudication.resolver.ts`
- Schema: `ReviewQuorumStatus`, `reviewQuorumStatus` query in `src/schema.gql`
- Configuration: `docs/dev/ops.md` (environment variables)
- UI: `aletheia-frontend/app/features/claimReview/components/ClaimReviewView.tsx`
- Tests: `aletheia-backend/src/graphql/resolvers/claim-adjudication.resolver.spec.ts`

---

## Relationship to Other ADRs

- **ADR-011** — Adjudication remains the only lifecycle mutation; ADR-030 adds a precondition.
- **ADR-015 / ADR-016** — Uses reviewer responses as **counts only**.

---

## Consequences

### Positive

- Aligns terminal decisions with minimum coordination throughput where policy requires it.

### Negative

- Operators must tune counts and communicate that ACK is coordination, not approval of claim content.
