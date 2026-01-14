'use client';

import { Box, Divider, Typography } from '@mui/material';

import { StatusPill } from '../../../components/clarity/StatusPill';

export type TransformationStep = {
  key: string;
  label: string;
  timestampIso?: string | null;
  detail?: string;
  /**
   * `known`: we have explicit data.
   * `unknown`: missing from API.
   * `inferred`: derived locally; must be labelled as such.
   */
  status: 'known' | 'unknown' | 'inferred';
};

export function TransformationStepList(props: { steps: TransformationStep[] }) {
  const { steps } = props;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Transformation steps (audit)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Steps are shown only when they can be justified. Missing steps are labeled unknown.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {steps.map((s) => (
          <Box
            key={s.key}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {s.label}
              </Typography>
              <StatusPill
                status={s.status}
                color={s.status === 'known' ? 'success' : s.status === 'inferred' ? 'warning' : 'default'}
              />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {s.timestampIso ? new Date(String(s.timestampIso)).toLocaleString() : 'Timestamp: unknown'}
            </Typography>
            {s.detail ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {s.detail}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

