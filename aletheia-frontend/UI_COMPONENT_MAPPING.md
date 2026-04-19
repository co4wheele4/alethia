# Aletheia — UI surface map (authoritative)

This file describes **what exists in this repository** today. It replaces earlier hypothetical component catalogs that did not match the epistemic contract (no semantic search, no confidence UI, no “truth state” widgets).

**Binding references:** [`docs/context/aletheia-core-context.md`](../docs/context/aletheia-core-context.md), [`docs/adr/ADR-004-frontend-architecture-overview.md`](../docs/adr/ADR-004-frontend-architecture-overview.md), [`docs/adr/ADR-005-graphql-contract-data-guarantees.md`](../docs/adr/ADR-005-graphql-contract-data-guarantees.md).

## App shell and navigation

| Area | Route / entry | Primary components |
| --- | --- | --- |
| Layout, sidebar | `app/components/layout/AppShell.tsx` | `AppShell` |
| Dashboard | `app/dashboard/page.tsx` | Page-local layout |
| Claims list | `app/claims/page.tsx` | `app/features/claims/components/ClaimsView.tsx` |
| Claim review | `app/claims/review/page.tsx` | `app/features/claimReview/components/ClaimReviewView.tsx` |
| Claim comparison | `app/claims/compare/page.tsx` | `app/features/claimComparison/components/ClaimComparisonView.tsx` |
| Documents | `app/documents/page.tsx`, `app/documents/[id]/page.tsx` | `app/features/documents/components/DocumentsListPane.tsx` |
| Evidence detail | `app/evidence/[id]/page.tsx` | `app/features/evidence/components/EvidenceViewer.tsx` |
| Search (non-semantic) | `app/search/page.tsx` | Search queries + list UI |
| Review queue | `app/review-queue/page.tsx` | `app/features/reviewerQueue/components/ReviewerQueueView.tsx` |
| Claim graph | `app/claims/graph/page.tsx` | `app/features/claimGraph/components/ClaimEvidenceGraphView.tsx` |
| Questions (gated) | `app/questions/page.tsx` | Question workspace containers under `app/features/questions/` |
| Ingestion / HTML crawl | `app/ingestion/html-crawl-runs/page.tsx` | Crawl run UI |

## Shared UX

| Concern | Location |
| --- | --- |
| Empty / blocked-state help | `app/components/common/WorkspaceEmptyHelp.tsx` |
| User guidance (ADR-038) | Copy in review/claims/evidence surfaces; see `docs/product/blocked-state-patterns.md` |

## What is intentionally not here

- Semantic search, embeddings in user workflows, relevance ranking, confidence meters, or “AI verdict” UI — excluded by ADR-006, ADR-022, ADR-033, and related ADRs.

*Last updated: 2026-04-19 (repository sync).*
