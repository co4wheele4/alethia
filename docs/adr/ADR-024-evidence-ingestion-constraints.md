# ADR-024: Evidence Ingestion Constraints

## Status

ACCEPTED

## Date

2026-04-09

---

## Context

Evidence must ground claims without interpretation. Any transformation, summarization, or derived metadata breaks reproducibility and auditability.

---

## Decision

Evidence is:

- **Immutable** after creation (append-only; no `updateEvidence`).
- **Reproducible**: verbatim span text is stored and hashed (SHA-256 over UTF-8 bytes).
- **Unmodified**: client-supplied snippet must exactly equal the document chunk slice at the declared offsets.

Schema vocabulary (aligned with `aletheia-backend/src/schema.gql`):

- **sourceType** — `EvidenceSourceKind` (required on create).
- **sourceReference** — satisfied by structured locators: `sourceDocumentId`, `chunkId`, `startOffset`, `endOffset` (not a separate string field).
- **content** — stored as `snippet` (verbatim span); required for `DOCUMENT` evidence on create.
- **createdAt** — server timestamp (required).

Forbidden on `Evidence` (and in ingestion):

- `tags`, `summary`, `classification`, `confidence` — **REQUIRES ADR** if product needs them.

---

## Implementation (repository)

- **Validation**: `createEvidence` requires non-empty verbatim `snippet` matching `extractSpan(chunk.content, start, end)`; persists `contentSha256`.
- **Persistence**: `Evidence.contentSha256` (`content_sha256`) in Prisma.
- **DB**: `BEFORE UPDATE` trigger on `evidence` rejects all updates (`EVIDENCE_IMMUTABLE`).
- **CI**: `aletheia-backend/scripts/adr024-evidence-ingestion.cjs` (chained in `npm run schema:lint`).
- **MSW / E2E helpers**: reject `updateEvidence` and derived field names in GraphQL requests.
- **Utility**: `evidenceContentSha256Hex` in `src/common/utils/evidence-content-hash.ts`.

**Not automated here (would require new ADR or infrastructure):** byte-level verification that fetched URL bytes match stored content; cross-check against external hosts.

---

## Relationship to Other ADRs

- **ADR-019**: Evidence model and `createEvidence`; ADR-024 tightens verbatim + hash + immutability.
- **ADR-006**: No confidence; ADR-024 forbids confidence-like fields on Evidence.
- **ADR-022 / epistemic guardrails**: Complementary — queries must not smuggle derived semantics.

---

## Outcome

Ingestion accepts only explicit, hash-stable verbatim spans; the database rejects in-place mutation of evidence rows.
