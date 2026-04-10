# ADR-032: HTML Evidence Crawl Boundaries

## Status

Status: ACCEPTED

## Date

2026-04-09

## Context

Aletheia stores evidence as immutable, referential, schema-valid records. Fetching HTML from the web for evidence requires **explicit mechanical boundaries** so that traversal is not confused with adjudication, ranking, or semantic “importance.”

## Decision

Introduce **deterministic HTML crawl ingestion**:

- One **seed URL**, bounded **depth**, bounded **page count**, **allowed hostnames** only, optional **query-string stripping**, and **follow mode** restricted to `STRICT_ONLY` (new modes require a new ADR).
- Links are taken only from `<a href="...">` in **document order**, then **stable lexicographic** ordering of normalized URLs for enqueueing.
- **BFS** by depth; stops when depth or `maxPages` would be exceeded.
- Each fetched page is stored as `Evidence` with `sourceType = HTML_PAGE`, `sourceUrl` = normalized URL, `rawBody` = exact response bytes, `contentSha256` = SHA-256 over those bytes.
- Each run is recorded in `HtmlCrawlIngestionRun` with join rows in `HtmlCrawlIngestionRunEvidence` (audit-only).

## Non-goals

- No inference, relevance, ranking, similarity, or conflict detection.
- No summarization, extraction, or highlighting of “key” content.
- No follow modes beyond `STRICT_ONLY` without a new ADR.

## UI

- Crawl runs are listed and inspectable as **audit records** (config copied verbatim).
- Evidence viewer shows **stored text** (lossless byte→latin1 view), optional **sandboxed iframe preview** (does not alter storage), and **raw bytes** (hex / base64 copy).

## Compliance

Schema lint (`schema-lint-adr032.cjs`) fails if `HtmlCrawlFollowMode` gains values other than `STRICT_ONLY` or if crawl types gain relevance-style fields.
