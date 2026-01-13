/**
 * AIResultCard Component
 * AI output display - never final without explanation
 */

'use client';

import { Card, CardContent, Typography, Box } from '@mui/material';

export interface AIResultCardProps {
  // TODO: Define props
  result?: string;
  confidence?: number;
  explanation?: string;
}

export function AIResultCard(props: AIResultCardProps) {
  const { result, confidence, explanation } = props;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Result
        </Typography>
        {result && <Typography variant="body1">{result}</Typography>}
        {confidence !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Confidence: {confidence}%
          </Typography>
        )}
        {explanation && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Explanation:
            </Typography>
            <Typography variant="body2">{explanation}</Typography>
          </Box>
        )}
        {!explanation && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
            ⚠️ Explanation required before finalizing
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
