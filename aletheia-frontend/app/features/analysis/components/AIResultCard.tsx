/**
 * AIResultCard Component
 * AI output display - never final without explanation
 */

'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';
import { alpha, lighten } from '@mui/material/styles';

export interface AIResultCardProps {
  // TODO: Define props
  result?: string;
  explanation?: string;
}

export function AIResultCard(props: AIResultCardProps) {
  const { result, explanation } = props;

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Result
        </Typography>
        {result && <Typography variant="body1">{result}</Typography>}
        {explanation && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              bgcolor: (theme) => alpha(lighten(theme.palette.background.default, 0.2), 0.72),
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Explanation:
            </Typography>
            <Typography variant="body2">{explanation}</Typography>
          </Box>
        )}
        {!explanation && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
            Explanation required before treating this as reliable output.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
