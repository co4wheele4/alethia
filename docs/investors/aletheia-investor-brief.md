# Aletheia — Investor Brief (Traceable Claims & Evidence)

**One-liner:** Aletheia is an **audit-first, non-inferential** claim-and-evidence system for organizations that must **prove provenance**—what was claimed, what evidence supports it, who decided, when, and why—without relying on opaque “AI truth scores.”

**What it is (today):** A production-grade full-stack foundation (NestJS GraphQL + Postgres/Prisma; Next.js/React frontend) with strong governance and testing, ready to rapidly productize the core workflows.

**What it becomes (the product):** A workflow layer for **evidence-backed decisioning**: capture claims, attach evidence, track adjudication, preserve integrity/audit trails, and export defensible reports for compliance, legal, policy, and research contexts.

---

## Why this exists (the problem)

Modern organizations are drowning in assertions:

- Policies, procedures, and compliance statements
- Vendor claims, safety claims, and marketing claims
- Research findings and internal knowledge base statements
- Incident/postmortem narratives and risk decisions

The failure mode is consistent: claims get repeated, edited, and reshared until they become “true by circulation,” while the evidence and rationale are lost. In regulated, contractual, or reputationally sensitive domains, the question isn’t “Is this probably true?”—it’s **“Can we prove what we relied on, and who approved it?”**

Most tools are either:

- **Document-centric** (wikis, shared drives): great for storage, poor for provenance and decision traceability, or
- **AI-answer-centric**: great for speed, poor for auditability and defensibility.

---

## The solution: non-inferential traceability

Aletheia deliberately avoids “truth scoring.” Instead, it treats **claims, evidence, and adjudication** as first-class objects:

- **Claims**: explicit statements with clear scope and ownership
- **Evidence**: sources (documents, excerpts, links, datasets) that support or contradict a claim
- **Adjudication**: human decisions with explicit rationale, roles, and timestamps
- **Integrity/audit**: integrity checks and audit/event logging to answer “what changed?” and “who knew what when?”

This design is a strong fit where decisions must withstand scrutiny: audits, legal discovery, procurement reviews, safety/compliance investigations, and policy governance.

---

## Product status (today) and why it matters

**Aletheia is unusually “enterprise-shaped” early**: it already has the structural pieces that typically slow teams down late (auth, RBAC posture, API discipline, extensive tests, and governance docs). The fastest path to revenue is completing the end-to-end workflows and packaging them for a narrow wedge.

What exists today (high-level):

- **Full-stack monorepo**: NestJS GraphQL backend + PostgreSQL/Prisma; Next.js/React frontend
- **Authentication & security posture**: JWT auth, role-based access control patterns, rate limiting posture
- **Quality and delivery readiness**: extensive automated tests across backend and frontend; strong repo governance posture (ADRs, canonical product context, and guardrails)

## Primary use cases (high-value wedges)

### 1) Compliance and audit readiness
**Audience:** compliance teams, internal audit, regulated operators  
**Outcome:** faster evidence collection, reproducible audit trails, reduced “spreadsheet archaeology.”

- Map policy claims → supporting evidence → sign-off decisions
- Maintain an always-current “defensibility packet” per control, product line, or region
- Demonstrate change history and adjudication across revisions

### 2) Legal & investigations (defensible narratives)
**Audience:** legal ops, investigations, risk, incident response  
**Outcome:** defensible timelines and evidence chains for decisions and statements.

- Track which evidence was available at the time of a decision
- Preserve citations/excerpts that back specific statements
- Export bundles suitable for review or external counsel workflows

### 3) Enterprise research & policy governance
**Audience:** policy teams, safety teams, knowledge management  
**Outcome:** prevent “folk knowledge” and provide structured, citeable internal truth maintenance.

- Govern high-stakes internal claims (security posture, vendor posture, safety standards)
- Attach evidence with traceable provenance and explicit “approved/contested/expired” states

### 4) Vendor / third-party claim verification (procurement)
**Audience:** procurement, security, compliance, vendor risk  
**Outcome:** structured verification of vendor claims with evidence and decision logs.

- Vendor claim registers (SOC2, ISO, SLAs, guarantees) tied to evidence and renewal dates
- Repeatable review workflows per vendor category or risk tier

### 5) High-stakes content & communications (reputation risk)
**Audience:** communications, editorial, PR, public sector comms  
**Outcome:** publish with citations and internal sign-off trails.

- Pre-publication fact packets: each statement backed by evidence
- Accountability: who approved which claim and why

---

## Who buys it (ICP and economic buyer)

### Best-fit customers (initial)
- **Mid-market to enterprise** organizations with compliance exposure (finance, healthcare, insurance, energy, defense-adjacent, critical infrastructure)
- Teams where “show your work” is already required, but is done manually in docs/spreadsheets

### Economic buyer
- **VP/Head of Compliance**, **General Counsel / Legal Ops**, **Risk**, **Security governance**, or **Policy** leadership

### End users
- Analysts, auditors, investigators, policy authors, researchers, reviewers/approvers

**Why they’ll care:** Aletheia reduces the cost of defensibility work while improving outcomes (audit readiness, decision quality, and reduced risk from unsupported claims).

---

## How much would customers realistically pay?

Pricing depends on how “compliance-critical” the workflow is. Realistic initial monetization is **B2B SaaS** with per-seat + workspace pricing, and an enterprise tier for governance features.

### Practical pricing bands (real-world ranges)
- **Team (10–50 users):** \$15–\$35 per user/month + \$200–\$1,000 per workspace/month  
  - Typical annual contract: **\$5k–\$30k**
- **Business (50–250 users):** \$25–\$60 per user/month + \$1k–\$5k per workspace/month  
  - Typical annual contract: **\$30k–\$250k**
- **Enterprise (250+ users / regulated):** custom (SSO/SAML, audit exports, retention, dedicated environments, SLAs)  
  - Typical annual contract: **\$250k–\$1M+** (especially when tied to compliance programs or legal risk reduction)

### Why these prices are credible
In these environments, the alternative is not “a cheaper app”—it’s:

- analyst hours spent chasing citations,
- delayed audits and remediation, and
- elevated legal/regulatory risk from missing provenance.

Reducing even a small number of audit/investigation cycles pays for the product.

---

## Competitive landscape & differentiation

### Not trying to be
- A chatbot that “answers questions”
- A model-generated truth engine
- A generic wiki

### Differentiation (the pitch)
- **Defensibility-first**: structured claims + evidence + adjudication + audit trails
- **Governance by design**: the system is intentionally resistant to “hand-wavey truth”
- **Engineering readiness**: strong testing/governance posture reduces delivery risk for enterprise features

This stance is a feature: it makes Aletheia deployable in environments where “AI says so” is unacceptable.

---

## Business viability (what’s strong, what’s risky)

### What’s already strong
- **Solid technical foundation** for enterprise-grade delivery (auth, RBAC, tested backend + modern frontend)
- **Clear product philosophy** that aligns with compliance-heavy budgets
- **A wedge that expands**: once claims/evidence exist, add workflows (reviews, assignments, reporting, integrations)

### Key risks (and how to mitigate)
- **Positioning risk**: buyers may expect “AI truth.”  
  - Mitigation: sell **audit outcomes** (defensibility packets, report exports, evidence workflows) and be explicit about non-inferential design.
- **Workflow completeness risk**: early versions must nail the core CRUD + review loop and exports.  
  - Mitigation: focus v1 on a narrow, high-value workflow (e.g., compliance controls or vendor claims) with polished export/reporting.
- **Go-to-market risk**: long enterprise cycles.  
  - Mitigation: start mid-market with a contained use case (10–50 seats) and expand.

---

## What remains to become a viable product (and realistic timeline)

**The codebase is “engineering-ready,” but the product needs workflow completion.** The backend and frontend are in place; the remaining work is primarily product surface area, UX, and operationalization.

### Minimum viable “sellable v1” (what must exist)
- **Core workflow UX**: create/manage claims, attach evidence (including excerpts), basic search/filter, and review/adjudication states (e.g., proposed → under review → accepted/contested → superseded)
- **Assignments & roles**: reviewer/approver flows aligned to RBAC
- **Exports**: generate shareable evidence packets (PDF/HTML) with citations/excerpts + a change history suitable for audits
- **Admin basics**: workspace management, user lifecycle, and retention/visibility rules appropriate for B2B
- **Deployment posture**: secure configuration, backups, and basic monitoring

### Realistic effort to reach sellable v1
Assuming 1–2 strong full-stack engineers + product/design support:

- **6–10 weeks** to ship a focused v1 for one wedge (compliance controls *or* vendor claims), including exports and onboarding
- **10–16 weeks** for an enterprise-ready v1 (SSO, audit exports hardened, multi-workspace administration, stronger retention controls)

What makes this timeline credible: the underlying platform is already built and heavily tested; this is primarily **product completion**, not foundational engineering research.

---

## Suggested initial go-to-market (GTM) motion

- **Start with a single wedge**: compliance controls, vendor verification, or investigations (pick one and own it)
- **Land with a “defensibility packet” outcome**: a concrete deliverable that replaces a painful manual process
- **Expand**: add integrations (document sources), advanced workflow routing, and enterprise governance features

---

## The ask (what funding accelerates)

Investment primarily accelerates:

- Productization of the core workflows (UX, exports, onboarding)
- Enterprise features (SSO/SAML, retention, admin, audit-grade reporting)
- GTM validation with 10–20 design partners in regulated/defensibility-first environments

---

## Summary

Aletheia is positioned to become the system of record for **evidence-backed claims** in environments where defensibility matters more than speed. It is not a “truth AI”; it is the infrastructure layer that makes organizational assertions **auditable, reviewable, and exportable**—and therefore sellable into compliance, legal, and governance budgets.

