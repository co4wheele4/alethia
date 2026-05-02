'use client';

/**
 * ADR-032: Audit-only listing of deterministic HTML crawl ingestion runs (no ranking or interpretation).
 */
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { Alert, Box, Stack, Typography } from '@mui/material';

import { AppShell } from '../../components/layout';
import { apolloErrorText } from '../../lib/apollo-error-text';
import { HTML_CRAWL_RUNS_QUERY } from '@/src/graphql/queries/htmlCrawlRuns.query';

type Row = {
  id: string;
  seedUrl: string;
  startedAt: string;
  status: string;
  crawlDepth: number;
  maxPages: number;
};

export default function HtmlCrawlRunsPage() {
  const { data, loading, error } = useQuery<{ htmlCrawlIngestionRuns: Row[] }>(HTML_CRAWL_RUNS_QUERY);
  const rows = data?.htmlCrawlIngestionRuns ?? [];

  return (
    <AppShell title="HTML crawl runs">
      <Stack spacing={2} data-testid="html-crawl-runs-list">
        <Typography variant="h5">HTML crawl ingestion runs</Typography>
        <Typography variant="body2" color="text.secondary">
          Mechanical crawl boundaries only (ADR-032). Runs are audit records; evidence rows are immutable snapshots.
        </Typography>
        {loading ? <Typography>Loading…</Typography> : null}
        {error ? (
          <Alert severity="error">
            Unable to load crawl runs.
            <Typography component="div" variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', opacity: 0.95 }}>
              {apolloErrorText(error)}
            </Typography>
          </Alert>
        ) : null}
        {!loading && !error && rows.length === 0 ? (
          <Alert severity="info" sx={{ bgcolor: 'action.hover' }}>
            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
              No crawl runs in this database for your current account.
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              Runs live only in the Postgres database your <strong>Nest</strong> process uses (
              <code style={{ fontSize: '0.85em' }}>DATABASE_URL</code>; startup logs print{' '}
              <code style={{ fontSize: '0.85em' }}>Database: …</code>). CLI crawls must use the same URL. Admins
              (including <strong>seed-admin@aletheia.test</strong> after test seed) see every run in that database.
            </Typography>
          </Alert>
        ) : null}
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Started</th>
              <th align="left">Seed URL</th>
              <th align="left">Status</th>
              <th align="left">Depth / max pages</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.startedAt).toISOString()}</td>
                <td>
                  <Link href={`/ingestion/html-crawl-runs/${r.id}`}>{r.seedUrl}</Link>
                </td>
                <td>{r.status}</td>
                <td>
                  {r.crawlDepth} / {r.maxPages}
                </td>
              </tr>
            ))}
          </tbody>
        </Box>
      </Stack>
    </AppShell>
  );
}
