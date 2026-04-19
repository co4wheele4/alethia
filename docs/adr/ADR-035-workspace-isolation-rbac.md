# ADR-035: Workspace Isolation + RBAC

## Status
Status: ACCEPTED

## Context

Deployments must isolate one actor’s claims, evidence, and documents from another’s. Multi-tenant **Workspace** rows and an `x-workspace-id` header remain a **future extension**; the MVP enforces isolation by **authenticated user** and **document ownership**.

## Decision

- **MVP workspace boundary:** The effective `workspaceId` is the authenticated user’s **document/evidence scope**. Primary domain objects reachable through the GraphQL API are constrained by `Document.userId`, evidence `createdBy` (for URL/HTML evidence), and the same visibility rules used for search and review coordination.
- **Roles:** `User.role` distinguishes routine users from **`ADMIN`**. `ADMIN` may run bundle import/export and other operations gated in the schema; those operations are **not** end-user claim/evidence truth paths.
- Cross-user reads and writes for non-admin flows are rejected or filtered at the API boundary (empty results, `null`, or `Forbidden` where applicable).

**Future (explicit multi-tenant):** Introduce persisted `Workspace` + `WorkspaceMember`, propagate `workspaceId` on rows, and validate `x-workspace-id` against membership. Until then, this ADR’s **isolation guarantees** are satisfied by JWT user scoping and ownership checks described above.

## Implementation notes (MVP)

- **Authentication:** `getGqlAuthUserId` (`aletheia-backend/src/graphql/utils/gql-auth-user.ts`) supplies the actor id; guarded resolvers use `JwtAuthGuard`.
- **List/detail scoping:** Claims and search apply a workspace predicate over evidence → document ownership (see `claim.resolver.ts`, `search.resolver.ts`). Evidence listing and `evidenceById` require document ownership or creator match (`evidence.resolver.ts`).
- **Bundle import/export:** `exportBundle` / `importBundle` are **ADMIN-only** and operate on the database as a whole for migration/ops; they are not substitutes for end-user workspace APIs and must not be exposed to non-admin clients for cross-tenant data exfiltration in a product deployment (enforce at gateway / RBAC in front of GraphQL).

## Consequences

- Seeds and operators must understand that “workspace” in UI copy means **your documents and evidence**, not necessarily a shared `Workspace` entity.
- When explicit multi-tenant workspaces are added, migrations and ADR amendments must preserve these isolation properties.

## References

- `aletheia-backend/prisma/schema.prisma` (`User`, `Document`, `Evidence`, `Claim`)
- `docs/adr/ADR-031-export-import-snapshot-bundles.md`, `docs/adr/ADR-037-external-interface-constraints.md`
