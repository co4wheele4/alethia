# ADR-011: Claim Adjudication API Contract

## Status
Status: ACCEPTED

## Date
2026-01-26

## Context

Aletheia’s frontend implements a **schema-faithful claim review UI** that explicitly blocks adjudication when required backend guarantees are missing (ADR-005, ADR-008).

At present:
- Claims can be viewed and inspected
- Evidence can be rendered
- Review actions are intentionally disabled

The missing piece is a **minimal, explicit, and enforceable GraphQL contract** for claim adjudication.

This ADR defines that contract.

## Goals

- Enable true end-to-end claim adjudication
- Preserve frontend discipline (no inferred behavior)
- Keep backend logic minimal, auditable, and safe
- Avoid premature complexity (confidence scoring, workflows, AI review)

## Non-Goals

- Claim comparison or conflict resolution (ADR-009, ADR-010)
- Confidence propagation or aggregation (ADR-006)
- Multi-reviewer consensus workflows
- Automated adjudication

## Decision

Introduce a **single explicit mutation** to transition a claim through its lifecycle, with server-side enforcement of allowed transitions.

## Claim Lifecycle States

```graphql
enum ClaimLifecycleState {
  DRAFT
  REVIEW
  ACCEPTED
  REJECTED
}
