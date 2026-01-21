/**
 * SearchResultExplanation Component
 * Results include "why matched" - highlight semantic relevance
 */

'use client';

import { Box, Typography, Chip } from '@mui/material';

export interface SearchResultExplanationProps {
  // TODO: Define props
  explanation?: string;
  relevanceScore?: number;
  matchedTerms?: string[];
}

export function SearchResultExplanation(props: SearchResultExplanationProps) {
  const { explanation, relevanceScore, matchedTerms = [] } = props;

  return (
    <Box sx={{ mt: 1 }}>
      {explanation && (
        <Typography variant="body2" color="text.secondary">
          Why matched: {explanation}
        </Typography>
      )}
      {relevanceScore !== undefined && (
        <Typography variant="caption" color="text.secondary">
          Relevance: {relevanceScore}%
        </Typography>
      )}
      {matchedTerms.length > 0 && (
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {matchedTerms.map((term, index) => (
            <Chip key={index} label={term} size="small" />
          ))}
        </Box>
      )}
    </Box>
  );
}
