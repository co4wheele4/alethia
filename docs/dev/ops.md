# Operations (ADR-026 / ADR-030 / ADR-031)

## Evidence reproducibility job (ADR-026)

From the repository root, with `DATABASE_URL` configured:

```bash
npx tsx scripts/jobs/runEvidenceReproCheck.ts
```

Optional:

- `--evidenceId=<uuid>` — run a single evidence row.
- `--olderThanHours=<n>` — skip rows whose latest check is newer than this window (batch mode only).

The job performs HTTP fetch and SHA-256 comparison only; it does not modify stored evidence rows.

## Review quorum (ADR-030)

Environment variables:

- `REVIEW_QUORUM_ENABLED` — set to `true` to require acknowledgements before terminal adjudication (`ACCEPTED` / `REJECTED`).
- `REVIEW_QUORUM_COUNT` — minimum number of `ACKNOWLEDGED` reviewer responses (default `2`).

Quorum is a structural precondition only: it does not imply correctness or consensus on substance.

## Export / import bundles (ADR-031)

- **Export:** GraphQL query `exportBundle(input: ExportBundleInput!): JSON!` (admin role). Filters are structural (`claimIds`, `lifecycle`, `createdAt` range, optional epistemic event date range).
- **Import:** GraphQL mutation `importBundle(input: ImportBundleInput!): ImportResult!` (admin role). Validates verbatim hashes for evidence snippets vs `contentSha256`. Collisions fail unless `allowOverwrite` is explicitly set.

Bundle shape is documented in `schemas/aletheiaBundle.schema.json`.
