/**
 * ActionSummaryFooter Component
 * Clear outcome statements - no dark patterns
 */

'use client';

import { Box, Typography } from '@mui/material';

export interface ActionSummaryFooterProps {
  // TODO: Define props
  summary?: string;
  consequences?: string[];
}

export function ActionSummaryFooter(props: ActionSummaryFooterProps) {
  const { summary, consequences = [] } = props;

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
      {summary && (
        <Typography variant="body2" gutterBottom>
          {summary}
        </Typography>
      )}
      {consequences.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Consequences:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {consequences.map((consequence, index) => (
              <li key={index}>
                <Typography variant="body2">{consequence}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  );
}
