# ADR-009: Claim Comparison & Conflict Detection

## Status
Status: REJECTED

## Date
2026-01-22

## Supersedes
None

## SupersededBy
None

## Context

An earlier draft proposed **semantic** claim-to-claim relationships and **conflict detection** grounded in interpretive analysis of evidence.

That approach is **incompatible** with Aletheia’s non-negotiable bar on **inference** (no automated conflict detection, no semantic relationship typing such as CONFLICTING/EQUIVALENT/OVERLAPPING as system outputs, no relevance or similarity ranking).

---

## Decision (REJECTED)

The system **does not** adopt automated conflict detection, claim-to-claim semantic relationship labels, or “conflict” signals computed from evidence overlap.

**Normative comparison behavior** is defined only as **structural, side-by-side inspection** of claims and their **explicitly linked** evidence (see **ADR-010**, **ADR-018**, **ADR-021**).

---

## Consequences

- No schema fields for `relatedClaim`, `conflict`, `relationshipType`, or similar derived semantics.
- UI comparison surfaces MUST remain read-only structural juxtaposition without inferring agreement or disagreement.

---

## Historical note

Prior text in revision history that described semantic conflict workflows is **non-normative** and **MUST NOT** be implemented.
