# Aletheia Backend Guarantees (v1)

This document is binding. If behavior differs, the backend is wrong.

## Core principle: inspectable truth only

Aletheia persists *claims*, *entities*, and *relationships* only when they are traceable to explicit source material (or are explicitly marked as incomplete via nullability).

The backend does **not** infer truth, confidence, relevance, or correctness.

## What the backend guarantees

### Documents and provenance

- **Persisted provenance summary**: `Document.sourceType` and `Document.sourceLabel` are persisted nullable fields.
  - They are **declared** at write-time, not inferred from content.
  - They are nullable for backward safety (legacy data).
- **Structured provenance record**: `Document.source` (a `DocumentSource` row) is persisted and addressable.
  - When present, it describes the origin snapshot via explicit fields (e.g. file metadata or URL metadata).
  - When absent, the document is epistemically incomplete and the backend will not fabricate provenance.

### Entity mentions (where something occurred)

- **Mention anchoring**: `EntityMention` always has persisted `entityId` and `chunkId`.
- **Optional span location**: `EntityMention.startOffset` and `EntityMention.endOffset` are persisted and nullable.
  - Offsets are 0-based, end-exclusive, and refer to `DocumentChunk.content`.
- **Optional captured text**: `EntityMention.excerpt` is persisted and nullable.
  - When present with offsets, it is intended to match the referenced substring; it is still “best-effort” and not truth by itself.

### Entity relationships (why a relationship exists)

- **Relationships are explicit records**: an `EntityRelationship` row is persisted with explicit `fromEntity`, `toEntity`, and `relation`.
- **Inspectable evidence anchors**: `EntityRelationship.evidence` is a list of persisted `EntityRelationshipEvidence` rows.
  - Each evidence row anchors into a specific `DocumentChunk` via explicit IDs (`relationshipId`, `chunkId`) and optional offsets/quote fields.
- **Explicit mention linkage**: `EntityRelationshipEvidence.mentionLinks` is a list of persisted join records.
  - Each link provides explicit IDs connecting an evidence anchor to one or more `EntityMention` IDs.
  - No implicit many-to-many tables are used; the join is modeled and stored explicitly.

## What the backend explicitly does NOT guarantee

- **No truthfulness/correctness guarantee**: the backend does not assert that any entity, mention, relationship, or quote is correct.
- **No confidence/relevance**: the backend does not store or compute confidence, relevance, ranking, or “best” results as part of the truth contract.
- **No inference/backfill**: missing provenance, missing offsets, or missing evidence is represented as `null` or empty lists; the backend will not guess or infer.
- **No hidden joins**: the backend will not present relationships that are not backed by persisted foreign keys / join records.

## What frontend components may rely on without question

- **If a field is exposed in GraphQL, it maps to persisted data** (or is nullable/empty when not captured).
- **Evidence traversal is deterministic**:
  - Relationship → Evidence uses persisted `EntityRelationshipEvidence.relationshipId`.
  - Evidence → Mention uses persisted `EntityRelationshipEvidenceMention` join records.
  - Mention → Chunk uses persisted `EntityMention.chunkId`.
  - Chunk → Document uses persisted `DocumentChunk.documentId`.
- **Null means “unknown / not captured”** (not “false”, not “low confidence”, not “irrelevant”).

## Deferred decisions (unsafe features)

### Confidence scoring

- **Why deferred**: any numeric confidence can be misread as truth likelihood.
- **Missing prerequisite**: a formally defined epistemic protocol (who produced the score, under what methodology, with what calibration, and with what audit trail).
- **Epistemic failure if implemented now**: users (and developers) will treat confidence as truth, collapsing uncertainty into an opaque number.

### Automated relationship inference

- **Why deferred**: inferred relationships are, by definition, not directly inspectable as truth claims.
- **Missing prerequisite**: a first-class “inference artifact” model that stores the exact prompts, models, parameters, outputs, and the evidence selection procedure as persisted, reviewable inputs.
- **Epistemic failure if implemented now**: relationships would appear “real” without a stable, inspectable derivation chain.

### Embedding-based similarity

- **Why deferred**: embeddings are lossy, model-dependent artifacts and are not evidence.
- **Missing prerequisite**: a strict separation between “retrieval aids” and “truth contract” objects, including provenance for embedding generation (model/version, input text span, timestamp).
- **Epistemic failure if implemented now**: similarity scores would be mistaken for semantic truth or relevance, leading to opaque, non-auditable reasoning paths.

### Search ranking

- **Why deferred**: ranking implies relevance judgments and value weighting.
- **Missing prerequisite**: an explicit ranking policy model with auditable inputs, constraints, and user-controllable parameters.
- **Epistemic failure if implemented now**: ranked outputs would implicitly claim importance/correctness without explicit, inspectable justification.

