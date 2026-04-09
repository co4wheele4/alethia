# Feature demo walkthrough

This guide lists practical steps to exercise the main Aletheia UI end-to-end. It assumes a **local dev stack** (PostgreSQL, backend API, Next.js frontend). For rich sample data, load the deterministic test seed first (see [Test database seed](../dev/test-seed.md)).

Use **`http://localhost:3000`** as the frontend base URL below unless your dev server uses another port or host.

**In-app copy:** With the dev server running, open **`/demo`** to render this file from the repository (`docs/demo/feature-walkthrough.md`). The same content is linked from **Overview** (`/dashboard`).

## Epistemic guardrails (what you will not see)

Aletheia is built for **provenance and inspection**, not automated verdicts. The UI does not present confidence scores, rankings, or “stronger/weaker” evidence. Claims are **statements**; evidence is **referential**. Review coordination is **not adjudication**.

---

## Deterministic demo values (after `npm run db:seed:test`)

These IDs and emails come from `aletheia-backend/scripts/seed/test-seed.lib.ts`. Run the seed only against `aletheia_test` (see [Test database seed](../dev/test-seed.md)).

### Sign-in

| Field | Value |
|--------|--------|
| Password (all seeded users) | `password123` |
| Admin | `seed-admin@aletheia.test` |
| Reviewer 1 | `seed-reviewer1@aletheia.test` |
| Reviewer 2 | `seed-reviewer2@aletheia.test` |
| Reviewer 3 | `seed-reviewer3@aletheia.test` |
| Author 1 | `seed-author1@aletheia.test` |
| Author 2 | `seed-author2@aletheia.test` |

### Which account to use (workspace scoping)

The UI loads **claims** and **documents in your workspace** from GraphQL: a claim appears only if it has evidence anchored on a document **you own** (`claims` query in `claim.resolver.ts`). The **documents** list uses `documentsByUser` for the logged-in user only.

| Goal | Account to sign in as | Why |
|------|-------------------------|-----|
| Claims list, claim review URLs, claim graph, comparison, review queue, evidence viewer (document list) | **`seed-author1@aletheia.test`** (or **`seed-author2@aletheia.test`**) | Seeded documents `d1`/`d3` belong to author 1; `d2` belongs to author 2. Those users see non-empty workspaces. |
| Adjudication mutation on a claim (API also requires evidence on **your** documents) | Same as whichever user owns the document for that evidence | Resolver scopes adjudication to the reviewer’s workspace evidence. |
| **`seed-admin@aletheia.test`** | Optional | Admin does **not** own seeded documents: **Claims**, **Documents** (sidebar list), and **Claim comparison** data can be **empty**. You can still open **`/documents/<uuid>`** by ID (the `document(id)` query returns the row for any authenticated user). |
| **`seed-reviewer1@aletheia.test`** (and other reviewers) | Usually not for claim/demo data | Reviewers have **no** seeded documents; claims and review-queue rows for seeded claims may be **empty** because the queue is scoped to claims visible in **your** workspace. |

**Recommendation:** Run the interactive demo as **`seed-author1@aletheia.test`** / `password123` unless you are testing admin-only behavior.

### Documents (open in UI)

| Title | Document ID |
|--------|-------------|
| Access control policy excerpt | `20000000-0000-4000-8000-000000000001` |
| Contract appendix B excerpt | `20000000-0000-4000-8000-000000000002` |
| Incident communication excerpt | `20000000-0000-4000-8000-000000000003` |

Example URL:

`http://localhost:3000/documents/20000000-0000-4000-8000-000000000001`

### Claims (filter and drill-in)

| Status | Claim ID | Example statement (seed text) |
|--------|----------|--------------------------------|
| `DRAFT` (no evidence) | `c0000001-0000-4000-8000-000000000001` | The company policy requires MFA for production access. |
| `DRAFT` (no evidence) | `c0000002-0000-4000-8000-000000000002` | The contract states payment is due within 30 days. |
| `DRAFT` (with evidence, no review request) | `c0000003-0000-4000-8000-000000000003` | Service X experienced downtime on 2024-07-14. |
| `REVIEWED` (“central” showcase, 5 evidence) | `c0000004-0000-4000-8000-000000000004` | Production access is governed by policy AC-2024-03. |
| `REVIEWED` (secondary A) | `c0000005-0000-4000-8000-000000000005` | Release checklists are referenced from the engineering wiki. |
| `REVIEWED` (secondary B) | `c0000006-0000-4000-8000-000000000006` | Contract appendix B specifies payment timing language. |
| `ACCEPTED` | `c0000007-0000-4000-8000-000000000007` | The invoicing clause uses a thirty-day payment window. |
| `ACCEPTED` | `c0000008-0000-4000-8000-000000000008` | Incident communications for Service X referenced the status page. |
| `ACCEPTED` | `c0000009-0000-4000-8000-000000000009` | HR handbook section 7.2 mentions annual acknowledgment. |
| `REJECTED` | `c0000010-0000-4000-8000-000000000010` | Late fee language applies starting on day thirty-two. |
| `REJECTED` | `c0000011-0000-4000-8000-000000000011` | Maintenance windows are always announced without a published end time. |
| `REJECTED` | `c0000012-0000-4000-8000-000000000012` | Remote work policy acknowledgment is optional. |

**Note:** Claims **`c0000001`** and **`c0000002`** (`DRAFT` with **no** evidence) exist in the database after seeding but are **not** returned by the `claims` query (they are outside the evidence-grounded workspace contract). They will **not** show in the Claims list or load in **Claim review** (`/claims/[claimId]`).

Example claim detail URL:

`http://localhost:3000/claims/c0000004-0000-4000-8000-000000000004`

### Evidence (shared across many claims)

Evidence ID `e0000001-0000-4000-8000-000000000001` is linked to **four** claims for structural reuse: `c0000004`, `c0000005`, `c0000006`, and `c0000007`. Use that to demonstrate **claim–evidence linkage** and the graph without implying similarity.

### Claim comparison (query string)

Example: compare the central reviewed claim with secondary A and an accepted claim:

`http://localhost:3000/claims/compare?base=c0000004-0000-4000-8000-000000000004&with=c0000005-0000-4000-8000-000000000005&with=c0000007-0000-4000-8000-000000000007`

### Review coordination (what to look for)

| Review request ID | Claim | Scenario |
|--------------------|-------|----------|
| `r0000001-0000-4000-8000-000000000001` | `c0000004` | Request exists; **no** assignments (pending assignment). |
| `r0000002-0000-4000-8000-000000000002` | `c0000005` | Two reviewers assigned; **no** responses yet. |
| `r0000003-0000-4000-8000-000000000003` | `c0000006` | Two reviewers; **both** acknowledged. |
| `r0000004-0000-4000-8000-000000000004` | `c0000007` | One reviewer acknowledged; one **declined** (assignment `b0000006-0000-4000-8000-000000000006`). |
| `r0000005-0000-4000-8000-000000000005` | `c0000008` | Two reviewers; both acknowledged. |

### Entities and relationships (minimal seed rows)

The test seed inserts two **entity** rows, two **mentions** on chunk `k1`, one **relationship** (`requires`), one **relationship evidence** anchor (TEXT_SPAN), and a link from that evidence to the MFA mention. IDs come from `test-seed.lib.ts`.

| Kind | ID |
|------|-----|
| Entity (policy) | `30000001-0000-4000-8000-000000000001` |
| Entity (control) | `30000002-0000-4000-8000-000000000002` |
| Mention (policy span) | `31000001-0000-4000-8000-000000000001` |
| Mention (MFA span) | `31000002-0000-4000-8000-000000000002` |
| Relationship | `32000001-0000-4000-8000-000000000001` |
| Relationship evidence | `33000001-0000-4000-8000-000000000001` |

### What the test seed does **not** populate

After **`db:seed:test` only**, you still have **no** lessons and **no** AI queries. Use **Questions** or **Analysis** only if you have other data (for example ingestion, the default `prisma/seed.ts`, or manual creation). Otherwise those screens may be empty.

---

## 1. Prerequisites

1. **Dependencies** — From the repo root: `npm install` (see [Monorepo setup](../MONOREPO_SETUP.md)).
2. **Database** — PostgreSQL reachable from `aletheia-backend` (`DATABASE_URL` in `.env` / `.env.test` as appropriate).
3. **Migrations** — From `aletheia-backend`: `npx prisma migrate deploy` (or your usual bootstrap).
4. **Optional showcase data** — For predictable IDs and scenarios: `npm run db:seed:test` (only against `aletheia_test`; see [Test database seed](../dev/test-seed.md)).

---

## 2. Run the application

From the repository root:

```bash
npm run dev
```

Or start backend and frontend separately (`npm run start:backend`, `npm run start:frontend`). Open the frontend URL (commonly `http://localhost:3000`).

---

## 3. Sign in

1. Open `/` and sign in.
2. **With test seed:** email **`seed-author1@aletheia.test`**, password **`password123`** (see [Which account to use](#which-account-to-use-workspace-scoping)).

Successful login routes you to **Overview** (`/dashboard`).

---

## 4. Overview (entry)

**Route:** `/dashboard`

- Read the entry copy (no “Ask AI” shortcut; sources come first).
- Use **View documents** and **Add source** to jump into document workflows.
- Optionally open **Onboarding wizard** (`/onboarding`) for the guided first-run flow.

**Example:** `http://localhost:3000/dashboard`

---

## 5. Documents and sources

**Route:** `/documents`

- Browse the document list and open a document: `/documents/[id]`.
- **With test seed** as **author 1:** you should see at least **Access control policy excerpt** and **Incident communication excerpt** (documents `d1` and `d3`). Author 2 sees **Contract appendix B excerpt** (`d2`).
- You can also paste a deep link for any seeded document UUID while logged in (any user): the document detail query loads by id.
- Use **Add source** from Overview or open `/documents?ingest=1` to add or ingest a source, depending on your build configuration.
- Inspect **chunks** and **provenance** fields as returned by the API (no summarization of body text as “truth”).

**Example:** `http://localhost:3000/documents/20000000-0000-4000-8000-000000000001`

---

## 6. Evidence inspection

**Route:** `/evidence`

- This screen is the **Document Evidence Viewer**: pick **your** documents, then inspect chunk text and entity mentions (it is **not** a flat catalog of Evidence rows by ID).
- For **ADR-019** evidence rows (id, snippet, offsets), open **Claim review** ([section 7](#7-claims-lifecycle-and-grounding)) or follow links from the **Claim–evidence graph**; the review panel lists evidence identifiers and verbatim snippets.
- **With test seed:** as author 1, select document **Access control policy excerpt**, then cross-check chunk text against claim **`c0000004`** on the claim review page. Evidence id **`e0000001-0000-4000-8000-000000000001`** appears there and on the graph, not as a dedicated row on `/evidence`.

**Example:** `http://localhost:3000/evidence`

### Evidence detail by ID (verbatim + reproducibility)

**Route:** `/evidence/[evidenceId]`

- Opens the **Evidence viewer** for a single evidence row: verbatim snippet, optional full document chunks (paged), copy actions, and a **reproducibility checks** table when the backend has run checks (ADR-026). This is inspection and audit metadata, not scoring.
- **With test seed:** deep-link to the shared evidence used across multiple claims:

`http://localhost:3000/evidence/e0000001-0000-4000-8000-000000000001`

- **Ops:** scheduled or manual reproducibility jobs are documented in [Operations](../dev/ops.md) (`runEvidenceReproCheck.ts`).

---

## 7. Claims (lifecycle and grounding)

**Route:** `/claims`

- Browse claims in various lifecycle states (`DRAFT`, `REVIEWED`, `ACCEPTED`, `REJECTED` as exposed in GraphQL).
- **With test seed** as **author 1:** use scope **Workspace (all documents)** to load claims that share evidence on your documents (includes `c0000003` draft, reviewed, accepted, and rejected examples—not all twelve IDs appear for every user).
- Open a claim: `/claims/[claimId]`. The page resolves the claim from the same **`claims`** list; if the claim is not in your workspace, the review view stays empty.
- On the detail view:
  - Read the claim text as a **statement**.
  - Follow **evidence** links to documents/chunks.
  - Use **adjudication** only through the explicit adjudication path when the API allows it for your user (coordination layers do not change lifecycle by themselves).

**Examples (signed in as author 1):**

- Draft **with** evidence: `http://localhost:3000/claims/c0000003-0000-4000-8000-000000000003`
- Reviewed, five evidence: `http://localhost:3000/claims/c0000004-0000-4000-8000-000000000004`
- Accepted: `http://localhost:3000/claims/c0000007-0000-4000-8000-000000000007`
- Rejected: `http://localhost:3000/claims/c0000010-0000-4000-8000-000000000010`

Do **not** expect `c0000001` / `c0000002` (draft, no evidence) to load here; see the table note above.

### Review quorum gate (coordination vs adjudication)

When **`REVIEW_QUORUM_ENABLED=true`** (and optional **`REVIEW_QUORUM_COUNT`**, see [Operations](../dev/ops.md)), the API may block terminal adjudication (`ACCEPTED` / `REJECTED`) until enough reviewer responses are **`ACKNOWLEDGED`**. The claim review UI surfaces **quorum status** as a mechanical gate, not a verdict. With quorum **disabled**, this line does not apply.

---

## 8. Claim–evidence graph (topology only)

**Route:** `/claims/graph`

- Navigate the **structural** claim–evidence graph (read-only topology per ADR-021).
- **With test seed** as **author 1:** scope **Workspace (all documents)** and locate nodes for claim **`c0000004`** and evidence **`e0000001`**; the same evidence id should connect to multiple claims when they appear in your workspace (**linkage only**, not similarity).

**Example:** `http://localhost:3000/claims/graph`

---

## 9. Claim comparison

**Route:** `/claims/compare?base=<claimId>&with=<otherId>` (multiple `with` values allowed)

- **With test seed** as **author 1:** use the full example URL in the **Claim comparison (query string)** subsection near the top of this document. The comparison view reads the same `claims` list as elsewhere; if that list is empty, fix the signed-in user (see [Which account to use](#which-account-to-use-workspace-scoping)).

---

## 10. Review queue (coordination only)

**Route:** `/review-queue`

- See **review requests**, **assignments**, and **reviewer responses** where your backend exposes them.
- **With test seed** as **author 1** (or **author 2** for requests they filed): you should see review requests whose **claims** are in your workspace. Use the **Review coordination** table near the top to spot `r0000001` (no assignments), `r0000002` (assignments, no responses), `r0000003` (acknowledged), and `r0000004` (decline on assignment `a6`). Exact visibility can differ slightly between author 1 and author 2 because claims are scoped by document ownership.
- Confirm that acknowledgements and declines are **coordination** signals; they do not replace adjudication for lifecycle transitions.

**Example:** `http://localhost:3000/review-queue`

---

## 11. Entities and relationships

**Routes:** `/entities`, `/entities/[id]`, `/relationships`

- List entities and open a detail page for mentions and linked context.
- On **Relationships**, inspect relationship rows and **evidence anchors** (offsets into chunks) as read-only inspection.
- **With test seed:** you should see the **policy** and **MFA control** entities, the **`requires`** relationship, and span anchors consistent with the IDs in the **Entities and relationships** table near the top of this document (not empty).

---

## 12. Questions workspace

**Route:** `/questions`

- Use the gated workspace where claims must be grounded in evidence per product rules (behavior depends on current schema and implementation).
- **Note:** May be sparse unless you add suitable claims and evidence outside the minimal test seed.

---

## 13. Provenance

**Route:** `/provenance`

- Review auditability and transformation visibility as implemented (document and pipeline provenance, not probabilistic scoring).

**Example:** `http://localhost:3000/provenance`

---

## 14. Analysis workspace

**Route:** `/analysis`

- Open the analysis workspace (not in the primary nav; use the URL or any in-app link your build provides). This is for structured inspection workflows tied to your GraphQL contract, not ad-hoc “AI verdicts.”
- **Note:** Often empty after test seed alone.

**Example:** `http://localhost:3000/analysis`

---

## 15. Theme and shell

- Toggle **theme** from the mobile navigation menu (or equivalent header entry).
- Use **Logout** from the same menu to end the session.

---

## 16. Admin: epistemic audit stream

**Route:** `/admin/epistemic-events` (admin role)

- Read-only list of **epistemic events** logged for structural audits (ADR-029). Sign in as **`seed-admin@aletheia.test`** / `password123` to access admin routes.

**Example:** `http://localhost:3000/admin/epistemic-events`

---

## 17. Admin: export / import bundles

- **Export** and **import** run through GraphQL (`exportBundle`, `importBundle`), not a dedicated nav item. Admins use them for portability and backup; validation is structural (verbatim hashes, collisions). See [Operations](../dev/ops.md) (ADR-031).

---

## Primary navigation reference

The authenticated shell’s default sidebar (see `AppShell` in the frontend) includes:

| Area            | Route              |
|-----------------|--------------------|
| Overview        | `/dashboard`       |
| Documents       | `/documents`       |
| Evidence        | `/evidence`        |
| Claims          | `/claims`          |
| Claim graph     | `/claims/graph`    |
| Review queue    | `/review-queue`    |
| Entities        | `/entities`        |
| Questions       | `/questions`       |
| Provenance      | `/provenance`      |

Additional URLs used in this walkthrough: `/demo`, `/onboarding`, `/documents?ingest=1`, `/claims/compare`, `/relationships`, `/analysis`, `/documents/[id]`, `/claims/[claimId]`, `/entities/[id]`, `/evidence/[evidenceId]`, `/admin/epistemic-events`.

---

## If something is empty

- Ensure the API is running and `DATABASE_URL` points at the DB you migrated.
- Seed or create documents, chunks, claims, and evidence through supported flows; optional **test seed** populates a full cross-section quickly (see [Test database seed](../dev/test-seed.md)).
- Remember that **AI**-backed areas (for example **Questions** / **Analysis**) may need data beyond `db:seed:test`; **entities** and **relationships** are populated by the test seed (see [section 11](#11-entities-and-relationships)).
- If **Claims**, **Documents**, or **Review queue** are empty, you are almost certainly signed in as a user with **no** seeded documents (for example **admin** or **reviewer**). Switch to **`seed-author1@aletheia.test`** or **`seed-author2@aletheia.test`**.

---

## Verification (repo consistency)

This walkthrough was checked against the current frontend and backend behavior:

- **Routes** in `aletheia-frontend/app` exist for every path listed in the primary nav table and the numbered sections.
- **Login** uses `router.push('/dashboard')` after success (`LoginForm.tsx`).
- **`claims` query** scopes by workspace evidence (`claim.resolver.ts`); **`documentsByUser`** requires the authenticated user id (`document.resolver.ts`). That implies **author** accounts for seeded data, not admin/reviewer, for filled claims and document lists.
- **`/evidence`** renders `DocumentsEvidenceLayout` (document-centric), not a global Evidence ID browser; **`/evidence/[id]`** is the per–evidence-id viewer (verbatim + reproducibility checks when present).
- **`/claims/[claimId]`** resolves the claim via `useClaims(null)` (`useClaimReview.ts`); claims without workspace evidence do not appear.
- **`/claims/compare`** uses `GetClaimsForComparison` → same `claims` query as above.
- **`reviewQueue`** scopes requests to claims in the current user’s workspace (`review-request.resolver.ts`).
- **Deterministic UUIDs** match `aletheia-backend/scripts/seed/test-seed.lib.ts` (`IDS` export).
