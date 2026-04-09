# ADR-025: Agent Role Restrictions

## Status
Status: ACCEPTED

## Context

Aletheia is a claim-and-evidence platform designed to enforce explicit truth handling without inference.

Core invariants include:

- Claims are statements, not facts
- Evidence provides authority but does not imply correctness
- Humans perform all adjudication
- No inference, ranking, scoring, clustering, or derived meaning
- Governance is enforced through ADRs, tests, and CI

AI agents can be useful for workflow automation and governance enforcement, but they represent a high-risk vector for introducing implicit semantic authority.

If agents are permitted to interpret, summarize, compare, or recommend, the system becomes implicitly inferential and violates foundational constraints.

---

## Decision

AI agents MAY be used only for **mechanical, structural, and governance workflows**.

Agents MUST NOT generate outputs that can be interpreted as conclusions about truth, correctness, relevance, or strength.

Agents must be constrained such that they can only:

- validate
- detect violations
- enforce schema/ADR constraints
- generate coordination artifacts
- execute reproducibility checks
- produce audit outputs

Agents MUST NOT:

- interpret claims
- interpret evidence
- compare claims
- recommend adjudication outcomes
- rank claims/evidence
- detect conflicts
- summarize evidence

---

## Allowed Agent Capabilities

Agents MAY perform the following actions:

### 1. Governance Enforcement

- Scan PR diffs for forbidden patterns
- Fail builds on ADR violations
- Detect schema drift
- Ensure schema snapshots match
- Ensure tests exist for ADR enforcement

### 2. Structural Data Integrity Audits

- Detect orphaned join records
- Detect invalid lifecycle transitions
- Detect claims in REVIEW without evidence
- Detect evidence objects missing required fields

### 3. Evidence Reproducibility Checks

- Re-fetch evidence sourceReference
- Compare retrieved content hash to stored hash
- Persist a reproducibility check record

### 4. Mechanical Evidence Ingestion

- Retrieve raw source bytes
- Store evidence exactly as retrieved
- Compute content hash
- Validate schema format

### 5. Coordination Automation (Non-Authoritative)

- Create ReviewRequest
- Assign reviewers via explicit mechanical rules (round robin, availability)
- Send notifications
- Record ACK/DECLINE responses

Agents MUST NOT select reviewers based on claim content.

---

## Forbidden Agent Capabilities

Agents MUST NOT perform:

### 1. Semantic Interpretation

- summarization
- highlighting important sections
- sentiment detection
- entity extraction if used as meaning selection

### 2. Truth/Correctness Inference

- confidence scoring
- “likely true” recommendations
- adjudication recommendations
- “strongest evidence” evaluation

### 3. Comparison / Ranking

- sorting claims by support
- grouping similar claims
- relatedClaims generation
- conflict detection

### 4. Derived Graph Semantics

- clustering
- inferred relationships
- computed metrics implying meaning

---

## Enforcement Requirements

### 1. No Agent-Generated Semantic Fields

Schema MUST NOT include any fields populated by agents such as:

- score
- confidence
- relevance
- similarity
- summary
- recommendedDecision

Complementary derived-semantic field constraints are enforced under **ADR-022** (query and schema surface).

### 2. Agent Output Must Be Typed as Non-Authoritative

All agent outputs MUST be stored as:

- audit records
- policy violations
- reproducibility checks
- workflow events

Agent outputs MUST NOT be stored as evidence, claim fields, or adjudication inputs.

### 3. Agent Workflows Must Be Machine-Restricted

Agents must operate in restricted modes:

- fixed rulesets
- explicit pattern matching
- schema validation
- deterministic checks

Agent workflows must not include generative reasoning about meaning.

---

## Consequences

### Positive

- Enables automation without inference creep
- Improves governance enforcement
- Provides scalable audit and compliance automation

### Negative

- Agents cannot provide semantic convenience features
- Reviewers must manually interpret evidence

---

## Test Requirements

- CI must fail if forbidden semantic agent fields are introduced
- Playwright must assert UI does not display agent “recommendations”
- Schema lint must fail on forbidden fields/patterns

---

## ADR Index Mapping

| ADR | Area | Enforcement |
| --- | --- | --- |
| ADR-025 | Agent Systems | schema lint + CI policy checks |

---

## Status Enforcement

- Violations MUST fail CI
- Exceptions require a new ADR
