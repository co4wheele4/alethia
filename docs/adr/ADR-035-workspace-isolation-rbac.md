# ADR-035: Workspace Isolation + RBAC

## Status

Status: ACCEPTED

## Context

Multi-tenant deployments require hard isolation between workspaces.

**Implementation note:** Database tables, resolver scoping, and UI workspace selector are not yet fully landed in the codebase; this ADR records the target contract. Coordination and adjudication permissions must be explicit and non-semantic.

## Decision

- Every primary domain object is scoped to a `workspaceId` (claims, evidence, documents, review coordination artifacts, ingestion runs, etc.).
- Membership carries a role: `ADMIN`, `AUTHOR`, `REVIEWER`, `VIEWER`.
- **ADMIN**: import/export bundles, adjudication where applicable.
- **AUTHOR** / **ADMIN**: evidence creation and ingestion runs.
- **REVIEWER**: reviewer responses only when assigned (existing coordination rules).
- **VIEWER**: read-only within the workspace.

Cross-workspace reads and writes are rejected at the API boundary.

## Implementation notes

- GraphQL clients must send an explicit workspace context (header `x-workspace-id` planned) validated against `WorkspaceMember`.
- Resolvers enforce `where: { workspaceId }` on all list/detail queries.

## Consequences

- Seeds, bundle import/export, and background jobs must propagate `workspaceId` consistently.

## References

- Planned: `aletheia-backend/prisma/schema.prisma` workspace models and migrations.
