# HTML crawl ingestion (ADR-032)

## What `crawlDepth` means (mechanical)

- The **seed URL** is depth `0`.
- A link discovered on a page at depth `d` is scheduled at depth `d + 1`.
- URLs with depth **greater than** `crawlDepth` are **not fetched** (the crawler may still dequeue them after the limit is reached, but they are skipped before fetch).

## What `maxPages` means (hard boundary)

- **At most** `maxPages` **HTTP fetches** are performed for a run (including the seed page).
- When the limit is reached, the crawl stops enqueueing further work beyond what the loop already scheduled.

## Traversal ordering

1. Extract `href` values from `<a>` tags in **HTML document order** (mechanical scan).
2. Normalize each URL (scheme `http`/`https`, host must appear in `allowedDomains`, optional query strip, trailing slash normalization per implementation).
3. **Sort** the normalized URLs for the page **lexicographically** (stable, `en` / `variant` sensitivity).
4. Enqueue in **BFS** order (queue processes in FIFO; new URLs are appended in sorted order).

## How evidence is stored

- Response body is stored **verbatim** as bytes (`raw_body` in the database).
- `content_sha256` is SHA-256 over those **exact** bytes.
- `source_url` is the **canonical normalized URL** used for the fetch.

## Security / rendering

- Default UI shows HTML as **text** inside a `<pre>` (not executed).
- An optional **sandboxed** iframe preview may be used; it does **not** rewrite stored bytes.
- Users can copy **base64** or inspect **hex** for byte-level inspection.

## Operations

- GraphQL: `createHtmlCrawlIngestionRun`, `htmlCrawlIngestionRun`, `htmlCrawlIngestionRuns`.
- CLI (repo root): `npx tsx scripts/ingestion/runHtmlCrawlIngestion.ts --seedUrl <url> --depth <n> --maxPages <n> --domains a.com,b.com --userId <uuid>`.

This path is **ingestion only**; it is **not** claim adjudication.
