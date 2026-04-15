# Aletheia vs typical AI systems

| Dimension | Typical AI assistant / RAG stack | Aletheia (this repository’s binding model) |
| --- | --- | --- |
| Core output | Generated answers, summaries, recommendations | **Stored records** and **explicit links** between claims and evidence |
| “Understanding” | Embeddings, relevance, semantic retrieval | **Non-semantic search** and deterministic ordering (ADR-033) |
| Truth | Often framed as confidence or plausibility | **No confidence** in the API; adjudication is **explicit** (ADR-006, ADR-011) |
| Conflicts | May detect or debate contradictions | **Structural comparison only**; ADR-009 semantic conflict detection is **REJECTED** |
| Audit story | Often opaque (model + prompt + data mix) | **Provenance and logs** tied to schema operations |

Aletheia is closer to **a ledger with citations** than to a chatbot. That is intentional: it reduces hidden authority.

**Not a limitation:** Saying “no inference” is how the product avoids **replacing governance** with software heuristics.
