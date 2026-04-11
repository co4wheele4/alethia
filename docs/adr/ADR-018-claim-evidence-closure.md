# ADR-018: Claim Evidence Closure Invariant

## Status
Status: ACCEPTED

## Date
2026-01-29

## Supersedes
None

## SupersededBy
None

## Context

Aletheia’s core principle is truth disclosure without inference. Claims are the atomic units of truth expression, but their authority derives exclusively from explicit evidence, not system inference, workflow progression, or UI affordances.

At present:

Claims may exist without attached evidence

Evidence is modeled and rendered but not mechanically required

Claims without evidence may still appear comparable, reviewable, or adjudicable through UI or tooling paths

This creates an unacceptable ambiguity:

A claim can appear truth-bearing without the epistemic substrate required to justify that appearance.

Left unconstrained, this ambiguity enables:

Implicit trust creep

Tooling that reasons over claims absent evidence

Future automation built on false authority

A mechanical invariant is required.

## Decision

Introduce Claim Evidence Closure as a system-wide invariant.

Evidence closure governs what claims are allowed to do, not what claims mean.

Claims MAY exist without evidence, but such claims are explicitly non-authoritative and workflow-ineligible until evidence is attached.

No inference, scoring, or confidence derivation is introduced.

## Definitions

### Claim Evidence Closure

A claim is evidence-closed if and only if:

It has one or more explicitly attached evidence objects

Those evidence objects are schema-valid and resolvable

Evidence closure is binary and explicit.

There is no partial closure, weighting, or confidence.

## Core Invariants

### 1. Authority Invariant

A claim without evidence:

MUST be treated as non-authoritative

MUST NOT be interpreted as truth-bearing

MUST NOT imply correctness, incorrectness, or conflict

Authority is not inferred from:

Claim existence

Claim age

Claim author

Claim usage frequency

### 2. Workflow Eligibility Invariant

Only evidence-closed claims MAY:

Participate in claim comparison views

Be adjudicated

Enter reviewer queues (coordination surfaces per ADR-014)

Be counted in any governance or audit metrics

Claims without evidence MUST be excluded from these workflows by construction.

Claims without evidence MUST NOT:

Have `ReviewRequest`, `ReviewAssignment`, or `ReviewerResponse` records created for them (coordination is non-authoritative but still presupposes an evidence-closed claim under ADR-014)

### 3. UI Invariant

For claims without evidence:

The UI MUST display explicit non-authoritative labeling

Comparison, adjudication, and review affordances MUST be disabled or absent

No confidence, ranking, or lifecycle indicators MAY be shown

The UI MUST NOT:

Encourage interpretation of unevidenced claims as actionable

Provide affordances that simulate authority

### 4. Schema-Faithfulness Invariant

Evidence closure:

Introduces no derived fields

Introduces no inferred metadata

Does not alter claim lifecycle semantics

Evidence presence is a constraint, not a computed property.

## Non-Goals (Explicit)

This ADR does NOT:

Require all claims to have evidence

Introduce evidence quality scoring

Infer trust or confidence

Automate claim rejection

Replace human adjudication (ADR-011)

## Relationship to Other ADRs

ADR-005: No assumptions beyond schema

ADR-009 (REJECTED) / ADR-010: Comparison remains structural and evidence-first

ADR-011: Adjudication remains explicit and manual

ADR-014: Persisted review coordination presupposes evidence-closed claims for any coordination artifacts that attach to a claim

## Consequences

### Positive

Eliminates implicit authority

Prevents inference creep

Creates a hard epistemic boundary

Enables safe future tooling and automation

### Negative

Some existing UI paths may become unavailable

Requires explicit handling of unevidenced claims

Slightly increases implementation complexity

These tradeoffs are intentional.

## Outcome

Claim Evidence Closure is adopted as a mechanical invariant.

Claims may exist freely, but only evidence-closed claims are permitted to act like truth within the system.

This preserves Aletheia’s truth-first architecture while enabling safe evolution.