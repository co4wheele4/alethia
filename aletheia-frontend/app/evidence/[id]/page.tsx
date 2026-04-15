'use client';

import { useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Box, Stack, Typography } from '@mui/material';

import { ContentSurface } from '../../components/layout';
import { EvidenceViewer } from '../../features/evidence/components/EvidenceViewer';
import { GET_EVIDENCE_DETAIL_QUERY } from '@/src/graphql/queries/evidenceDetail.query';

type EvidenceDetailData = {
  evidenceById: {
    id: string;
    createdAt: string;
    sourceType: string;
    sourceUrl?: string | null;
    snippet?: string | null;
    contentSha256?: string | null;
    rawBodyBase64?: string | null;
  } | null;
  evidenceReproChecks: Array<{
    id: string;
    checkedAt: string;
    fetchStatus: string;
    hashMatch: string;
    fetchedHash?: string | null;
    errorMessage?: string | null;
  }>;
};

export default function EvidenceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const { data, loading, error } = useQuery<EvidenceDetailData>(GET_EVIDENCE_DETAIL_QUERY, {
    variables: { id },
    skip: !id,
  });

  const ev = data?.evidenceById;
  const checks = data?.evidenceReproChecks ?? [];

  return (
    <ContentSurface>
      <Stack spacing={2}>
        <Link href="/evidence">Back to evidence list</Link>
        <Typography variant="h5">Evidence</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Evidence is stored and rendered as recorded. Aletheia does not assess correctness, strength, or relevance
          (ADR-038).
        </Typography>
        {loading ? <Typography>Loading…</Typography> : null}
        {error ? <Alert severity="error">Failed to load evidence.</Alert> : null}
        {!loading && !ev ? <Alert severity="warning">Evidence not found.</Alert> : null}
        {ev ? (
          <>
            <EvidenceViewer
              content={ev.snippet ?? ''}
              rawBodyBase64={ev.rawBodyBase64}
              sourceUrl={ev.sourceUrl}
              contentSha256={ev.contentSha256}
              sourceTypeLabel={ev.sourceType}
              createdAtLabel={new Date(ev.createdAt).toISOString()}
            />
            <Typography variant="h6">Reproducibility Checks</Typography>
            {checks.length === 0 ? (
              <Typography variant="body2">No reproducibility checks recorded.</Typography>
            ) : (
              <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th align="left">Checked at</th>
                    <th align="left">Fetch</th>
                    <th align="left">Hash</th>
                    <th align="left">Fetched hash</th>
                    <th align="left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map((c) => (
                    <tr key={c.id}>
                      <td>{new Date(c.checkedAt).toISOString()}</td>
                      <td>{c.fetchStatus}</td>
                      <td>{c.hashMatch}</td>
                      <td style={{ wordBreak: 'break-all' }}>{c.fetchedHash ?? '—'}</td>
                      <td>{c.errorMessage ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            )}
          </>
        ) : null}
      </Stack>
    </ContentSurface>
  );
}
