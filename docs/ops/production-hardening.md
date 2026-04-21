# Production hardening — Aletheia

**Scope:** Operational safety **without** changing epistemic semantics. **Last updated:** 2026-04-19

---

## GraphQL (ADR-034)

| Control | Implementation | Notes |
| --- | --- | --- |
| Depth limit | `aletheia-backend/src/graphql/graphql-validation-rules.ts` (`adr034DepthLimitRule`, max depth **14**) | Errors mapped to `QUERY_DEPTH_EXCEEDED` in `graphql-config.ts` |
| Selection budget | `adr034QueryCostLimitRule` (default **900** field selections) | Mapped to `QUERY_COST_EXCEEDED` |
| Pagination | List helpers / `list-pagination` patterns | Enforce caps in resolvers per existing patterns |

---

## Search (ADR-033)

- String filters only (`EXACT` / `PREFIX` / `SUBSTRING`); no full-text ranking or `ts_rank`.
- Ordering uses explicit deterministic enums where exposed (`DeterministicOrderBy`).

---

## Rate limiting

- **Current state:** No dedicated API gateway rate limit is defined in-repo; if deploying behind a reverse proxy, configure **structural** rate limits (HTTP 429) per route class. Do not use “smart” client scoring.

---

## Background jobs

- Evidence repro checks (`scripts/jobs/runEvidenceReproCheck.ts`, ADR-026): treat failures as **structural** (fetch/hash mismatch); no auto-rewrite of evidence content.
- Ingestion/crawl: deterministic pipelines only (ADR-032).

---

## Error codes

- GraphQL errors use stable `extensions.code` values (see `GQL_ERROR_CODES`); clients should branch on codes, not message text.

---

## Logging and observability (ADR-029)

- Epistemic events are **structural** (governance-tagged errors, audit). They MUST NOT encode confidence, rankings, or interpretive conclusions.

---

## Integrity

- Adjudication hash chain (ADR-036); bundle import validation (ADR-037). Run integrity APIs and export checks on a schedule in production.

---

## Deployment

- Require **Postgres migrations** before app rollout; `mvp-release-gate` exercises migrate + backend e2e against Postgres 15.
- Environment: set `DATABASE_URL` and application secrets via platform secrets manager; never log connection strings.
- First-time production rollout: see [`go-live-checklist.md`](go-live-checklist.md).

---

## Related docs

- [`monitoring-and-alerting.md`](monitoring-and-alerting.md) — signal types and anti-patterns.
- [`backup-restore-validation.md`](backup-restore-validation.md) — export/import drills.
