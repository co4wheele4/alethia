# Investor demo dataset + walkthrough

This repo includes a deterministic demo seed you can run against a dedicated Postgres database to support investor walkthroughs.

## What this demo shows (in 10–15 minutes)

- **Source transparency**: each document has structured provenance (`DocumentSource`).
- **Mechanical chunking**: documents are split into paragraph chunks (`DocumentChunk`).
- **Evidence anchors (ADR-019)**: claims are linked to reusable, inspectable evidence (`Evidence` + `ClaimEvidenceLink`).
- **Coordination-only review**: review requests/assignments/responses coordinate attention without asserting truth.
- **Entity graph primitives**: entities + mentions with offsets; a relationship with an explicit evidence quote anchor.
- **HTML crawl audit**: a crawl run creates `HTML_PAGE` evidence (raw bytes) plus an audit record.
- **Governance guardrails**: an epistemic audit event illustrates policy enforcement without rankings.

## Accounts (demo seed)

- **Admin**: `seed-admin@aletheia.test` / `password123`
- **Founder**: `demo-founder@aletheia.test` / `password123`
- **Reviewer**: `demo-reviewer@aletheia.test` / `password123`

## One-time setup

1. Create a dedicated demo database (name must include `"demo"`, e.g. `aletheia_demo`).
2. Copy `aletheia-backend/.env.demo.example` to `aletheia-backend/.env.demo` and set `DATABASE_URL`.
3. Apply migrations to the demo DB (same way you do for dev/test).

## Seed the demo dataset

From `aletheia-backend/`:

```bash
npm run db:seed:demo
```

## Walkthrough script (suggested flow)

1. **Login** as `demo-founder@aletheia.test`.
2. Open **Documents**:
   - Show that each document has a **source label/type** (provenance).
   - Open the press release snapshot, scroll chunks, and point out this is mechanical paragraph chunking.
3. Open **Claims**:
   - Open “ACME Bio announced a Phase 2 trial of Trial X…”
   - Show the evidence anchor: chunk + offsets + verbatim snippet.
   - Emphasize: *Aletheia does not compute “confidence”—traceability is the mechanism.*
4. Open **Entities**:
   - Show `ACME Bio`, `Trial X`, `FDA`.
   - Open mentions: each mention points to a chunk and offsets.
5. Open **Entity relationships**:
   - Show relationship `RUNS_TRIAL` with a **quote evidence** anchor linked to concrete mention IDs.
6. Open **Review queue**:
   - Show a review request created by the founder and assigned by the admin.
   - Show reviewer response is **coordination-only**, not a truth verdict.
7. Open **HTML crawl runs**:
   - Show the crawl audit record and the `HTML_PAGE` evidence snapshot.
   - Note: the crawl stores raw HTML bytes as immutable evidence; document ingestion is a separate mechanical step.

