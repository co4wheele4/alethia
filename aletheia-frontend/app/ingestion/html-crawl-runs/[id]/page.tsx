'use client';

import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import { AppShell } from '../../../components/layout';
import { HTML_CRAWL_RUN_DETAIL_QUERY } from '@/src/graphql/queries/htmlCrawlRuns.query';

type Fetched = {
  evidenceId?: string | null;
  url: string;
  depth: number;
  fetchStatus: string;
  errorMessage?: string | null;
};

type RunDetail = {
  id: string;
  seedUrl: string;
  crawlDepth: number;
  maxPages: number;
  allowedDomains: string[];
  includeQueryParams: boolean;
  followMode: string;
  startedAt: string;
  finishedAt?: string | null;
  status: string;
  errorLog?: string | null;
  fetchedEvidence: Fetched[];
};

export default function HtmlCrawlRunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const { data, loading, error } = useQuery<{ htmlCrawlIngestionRun: RunDetail | null }>(
    HTML_CRAWL_RUN_DETAIL_QUERY,
    { variables: { id }, skip: !id },
  );

  const run = data?.htmlCrawlIngestionRun;

  const configJson = run
    ? JSON.stringify(
        {
          crawlDepth: run.crawlDepth,
          maxPages: run.maxPages,
          allowedDomains: run.allowedDomains,
          includeQueryParams: run.includeQueryParams,
          followMode: run.followMode,
        },
        null,
        2,
      )
    : '';

  return (
    <AppShell title="HTML crawl run">
      <Stack spacing={2} data-testid="html-crawl-run-detail">
        <Link href="/ingestion/html-crawl-runs">Back to crawl runs</Link>
        <Typography variant="h5">Crawl run</Typography>
        {loading ? <Typography>Loading…</Typography> : null}
        {error ? <Alert severity="error">Unable to load run.</Alert> : null}
        {!loading && !run ? <Alert severity="warning">Run not found.</Alert> : null}
        {run ? (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  void navigator.clipboard.writeText(run.seedUrl);
                }}
              >
                Copy seed URL
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  void navigator.clipboard.writeText(configJson);
                }}
              >
                Copy config
              </Button>
            </Stack>
            <Typography variant="subtitle2">Configuration (exact)</Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'auto',
                maxHeight: 320,
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              {configJson}
            </Box>
            <Typography variant="body2">Seed URL: {run.seedUrl}</Typography>
            <Typography variant="body2">Status: {run.status}</Typography>
            <Typography variant="body2">
              Started: {new Date(run.startedAt).toISOString()}
              {run.finishedAt ? ` — Finished: ${new Date(run.finishedAt).toISOString()}` : ''}
            </Typography>
            {run.errorLog ? (
              <>
                <Typography variant="subtitle2">Error log</Typography>
                <Box
                  component="pre"
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', overflow: 'auto', fontFamily: 'monospace' }}
                >
                  {run.errorLog}
                </Box>
              </>
            ) : null}
            <Typography variant="subtitle2">Fetched URLs</Typography>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }} data-testid="html-crawl-url-table">
              <thead>
                <tr>
                  <th align="left">Depth</th>
                  <th align="left">URL</th>
                  <th align="left">Fetch</th>
                  <th align="left">Evidence</th>
                  <th align="left">Note</th>
                </tr>
              </thead>
              <tbody>
                {run.fetchedEvidence.map((f, i) => (
                  <tr key={`${f.url}-${i}`}>
                    <td>{f.depth}</td>
                    <td style={{ wordBreak: 'break-all' }}>{f.url}</td>
                    <td>{f.fetchStatus}</td>
                    <td>
                      {f.evidenceId ? (
                        <Link href={`/evidence/${f.evidenceId}`}>Open evidence</Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{f.errorMessage ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </>
        ) : null}
      </Stack>
    </AppShell>
  );
}
