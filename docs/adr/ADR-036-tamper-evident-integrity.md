# ADR-036: Tamper-Evident Integrity Guarantees

## Status

Status: ACCEPTED

## Context

Auditability requires structural integrity checks: hashes over persisted bytes and append-only adjudication history.

## Decision

1. **Evidence** must store `contentSha256` where required by ADR-024 / ADR-032 (existing columns).
2. **Adjudication logs** carry an append-only hash chain:
   - `prevHash`: `entryHash` of the prior log row in chronological order (null for the first row).
   - `entryHash`: `SHA-256` hex over `prevHash|claimId|adjudicatorId|decision|createdAt` (pipe-separated, ISO timestamp).
3. **validateIntegrity(workspaceId)** (admin-only) returns **counts only**:
   - missing adjudication hashes
   - broken chain links
   - hash mismatches
   - evidence rows missing `contentSha256`

No trust scores or quality semantics.

## Implementation

- `aletheia-backend/src/common/integrity/adjudication-entry-hash.ts`
- `aletheia-backend/src/integrity/integrity.service.ts`
- `aletheia-backend/src/graphql/resolvers/integrity.resolver.ts`
- Migration: `aletheia-backend/prisma/migrations/20260410140000_adr036_adjudication_hash_chain/migration.sql`

## Consequences

- Legacy adjudication rows may have null hashes until backfilled; integrity report counts them as missing.
