# ADR-027: Database-Level Epistemic Constraints

## Status

Status: ACCEPTED

## Date

2026-04-09

---

## Context

GraphQL and application code enforce most epistemic rules (ADR-011, ADR-018, ADR-023). Direct database access, failed migrations, or future tooling could still violate invariants unless the database rejects invalid transitions.

PostgreSQL can enforce **structural** rules that mirror product intent: immutability of evidence payloads, and valid claim lifecycle transitions relative to evidence links and audit logs.

---

## Decision

Aletheia SHALL use **database-level constraints** (triggers and related rules) to complement application enforcement:

- Block inappropriate **updates** to evidence rows where immutability is required by policy.
- Enforce **claim status transitions** against evidence linkage and adjudication audit expectations as defined in the migration.

Exact predicate logic lives in the migration SQL; this ADR records the **architectural decision** to enforce epistemic integrity at the DB layer, not every SQL detail.

---

## Rules

1. **Complement, not replace** — DB rules MUST align with GraphQL resolvers (ADR-023); conflicts between layers are bugs.
2. **No semantic scoring** — Constraints enforce structural integrity and allowed transitions, not “truth” or confidence.
3. **Test coverage** — Changes to triggers MUST be covered by integration tests against a real PostgreSQL instance where feasible.

---

## Implementation (repository)

- Migration: `aletheia-backend/prisma/migrations/20260409160000_adr027_epistemic_db_constraints/migration.sql`
- Optional rollback reference: `migration_down.sql` alongside the migration when present
- Tests: `aletheia-backend/test/e2e/db/adr027-epistemic-constraints.e2e-spec.ts`

---

## Relationship to Other ADRs

- **ADR-023** — Application-level adjudication exclusivity; ADR-027 adds defense in depth at persistence.
- **ADR-018 / ADR-019** — Evidence closure and structure; DB rules protect those invariants from bypass.

---

## Consequences

### Positive

- Stronger guarantees against accidental ORM or SQL updates that violate epistemic rules.

### Negative

- Migrations and triggers are harder to evolve; schema changes require coordinated updates and tests.
