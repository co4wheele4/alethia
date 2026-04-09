'use client';

/**
 * Admin-only audit listing (ADR-029). Structural filters only; no interpretation.
 */
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { Alert, Box, Stack, Typography } from '@mui/material';

import { ContentSurface } from '../../components/layout';

const ADMIN_EPISTEMIC_EVENTS = gql`
  query AdminEpistemicEvents($filter: EpistemicEventFilterInput) {
    adminEpistemicEvents(filter: $filter) {
      id
      createdAt
      eventType
      actorId
      targetId
      errorCode
      metadata
    }
  }
`;

type Row = {
  id: string;
  createdAt: string;
  errorCode: string;
  actorId?: string | null;
};

export default function AdminEpistemicEventsPage() {
  const { data, loading, error } = useQuery<{ adminEpistemicEvents: Row[] }>(
    ADMIN_EPISTEMIC_EVENTS,
    {
      variables: { filter: {} },
    },
  );
  const rows = data?.adminEpistemicEvents ?? [];

  return (
    <ContentSurface>
      <Stack spacing={2}>
        <Typography variant="h5">Epistemic events (audit)</Typography>
        {loading ? <Typography>Loading…</Typography> : null}
        {error ? <Alert severity="error">Unable to load events (admin role required).</Alert> : null}
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Time</th>
              <th align="left">Code</th>
              <th align="left">Actor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toISOString()}</td>
                <td>{r.errorCode}</td>
                <td>{r.actorId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </Box>
      </Stack>
    </ContentSurface>
  );
}
