# Aletheia for engineers

Aletheia is a **governed record system** for claims, evidence, and explicit adjudication—not a model that infers truth from text.

## What you get

- **Traceability:** Claims connect to evidence that points at stored documents and spans. You can audit **what was linked**, not what an algorithm “believed.”
- **Explicit lifecycle changes:** Adjudication and related operations go through **schema-defined mutations** with audit trails (see ADRs 011, 023, 036).
- **Non-semantic search:** Find records with string matching; there is no vector search or relevance ranking (ADR-033).
- **Import/export:** Snapshot bundles with JSON Schema validation (ADR-031, ADR-037).

## What you do not get

- Embeddings, similarity search, clustering, or automatic conflict resolution as product behavior.
- Confidence scores or “best answer” APIs.
- LLM extraction paths as authoritative sources of truth in the default contract.

## Why “no inference” is a feature

In regulated or audit-heavy settings, **explainability comes from traceability**, not probability. Aletheia keeps the contract boring on purpose: fewer places for hidden authority to creep in.

## Where to read the binding rules

- [`docs/context/aletheia-core-context.md`](../context/aletheia-core-context.md)
- ADRs under `docs/adr/`, especially ADR-005, ADR-018, ADR-022, ADR-025, ADR-038
