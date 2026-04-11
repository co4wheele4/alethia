# ADR-019: Evidence Semantics & Structure

## Status
Status: ACCEPTED

## Date
2026-01-29

---

## Context

Aletheia defines claims as non-inferential statements and enforces evidence closure (ADR-018).
However, evidence itself is not yet strictly defined at the schema level.

Current risks:
- Evidence may lack referential integrity
- Evidence may not be reproducible
- Evidence may drift into interpretation or summarization
- Evidence may appear valid without structural guarantees

This creates a failure mode:

> Claims may appear evidence-backed without guaranteeing that the evidence is real, stable, or traceable.

---

## Decision

Define **Evidence as a strict, immutable, referential contract**.

The system enforces:
- Structural validity
- Referential integrity
- Immutability

The system does NOT enforce:
- correctness
- relevance
- strength of support

---

## Definitions

### Evidence

Evidence is a **reference to source material** that enables inspection of a claim.

Evidence consists of:
- A source (document, URL, or artifact)
- A locator (offsets or anchors)
- Optional verbatim snippet
- Traceability metadata

Evidence does NOT:
- assert correctness
- imply support strength
- carry confidence or scoring

---

## Core Invariants

### 1. Referential Integrity

Evidence MUST:
- reference a valid source
- include sufficient locator data to reproduce context
- be traceable back to original material

Invalid or non-resolvable evidence MUST be rejected.

---

### 2. Immutability

Evidence is write-once:
- No updates after creation
- Corrections require new evidence records
- Historical evidence is preserved

---

### 3. Non-Inference

Evidence MUST NOT include:
- confidence
- ranking
- scoring
- derived conclusions

The system exposes evidence but does not interpret it.

---

### 4. Evidence–Claim Separation

- Evidence is independent of claims
- Evidence may be linked to multiple claims
- Claims reference evidence; they do not own it

---

### 5. Binary Validity

Evidence is:
- Valid (accepted)
- Invalid (rejected)

There is no partial validity or quality scoring.

---

## Required Fields

Each Evidence object MUST include:

- id
- sourceId (or URL)
- sourceType
- locator (offsetStart + offsetEnd OR equivalent anchor)
- createdAt
- createdBy

Optional:
- snippet (verbatim only)

---

## Relationship to Other ADRs

- ADR-005: Schema faithfulness
- ADR-018: Evidence closure depends on valid evidence
- ADR-020: UI must render evidence faithfully (source fidelity, boundary integrity, no interpretation)
- ADR-011: Evidence informs adjudication, does not decide it
- ADR-014: Review coordination operates only on evidence-closed claims

---

## Non-Goals

This ADR does NOT:
- define evidence quality
- rank or score evidence
- infer correctness
- require evidence for all claims

---

## Migration Path: claim_evidence → Evidence + ClaimEvidenceLink

Existing `claim_evidence` rows must be migrated to `evidence` + `claim_evidence_links`. This is an explicit migration path (not auto-applied).

### Valid source data

1. **claim_evidence with mention links**: Create one Evidence per mention.
   - `chunkId`, `startOffset`, `endOffset`, `snippet` from EntityMention
   - `sourceDocumentId` from DocumentChunk.documentId
   - `createdBy` from Document.userId

2. **claim_evidence with relationship links only**: Create one Evidence per EntityRelationshipEvidence.
   - `chunkId`, `startOffset`, `endOffset`, `snippet` from EntityRelationshipEvidence
   - `sourceDocumentId` from DocumentChunk.documentId
   - `createdBy` from Document.userId

3. **claim_evidence with neither**: Create one Evidence using first chunk.
   - `chunkId` = first DocumentChunk of document (by chunkIndex)
   - `startOffset` = 0, `endOffset` = chunk.content.length
   - `createdBy` from Document.userId

### Invalid source data (DO NOT silently fix)

- **Document has no chunks**: Cannot create valid Evidence (no locator). Skip. Log. Manual remediation required.
- **Chunk missing or deleted**: Skip. Log.
- **User (document owner) deleted**: Migration fails; fix user references first.

### Execution

After applying the schema migration `20260130000000_adr019_evidence_semantics`:

```bash
node aletheia-backend/scripts/migrate-claim-evidence-to-adr019.cjs
```

The script creates Evidence and ClaimEvidenceLink rows. It does not drop legacy tables; a follow-up migration may remove them after verification.

### Verification

- Every claim that had claim_evidence must have at least one claim_evidence_link.
- Evidence rows must have valid sourceDocumentId, chunkId, startOffset, endOffset.
- No confidence, scoring, or derived fields.

---

## Consequences

### Positive
- Guarantees traceable evidence
- Prevents unverifiable claims
- Enables auditability

### Negative
- Stricter validation
- Migration required for existing data

---

## Outcome

Evidence is a **strict, immutable, referential contract**.

If a claim has evidence, that evidence is guaranteed to be:
- structurally valid
- traceable
- reproducible

The system does NOT guarantee that the evidence proves the claim.