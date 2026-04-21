/**
 * Optional UI for explaining why a row appeared in a list.
 * Epistemic: no semantic ranking — `matchCoveragePercent` is only for deterministic
 * substring / filter coverage when a parent passes it (production search uses explicit order only).
 */

'use client';

import { Box, Typography, Chip } from '@mui/material';

export interface SearchResultExplanationProps {
  explanation?: string;
  /** 0–100: deterministic match coverage when a caller supplies it; not semantic relevance. */
  matchCoveragePercent?: number;
  matchedTerms?: string[];
}

export function SearchResultExplanation(props: SearchResultExplanationProps) {
  const { explanation, matchCoveragePercent, matchedTerms = [] } = props;

  return (
    <Box sx={{ mt: 1 }}>
      {explanation && (
        <Typography variant="body2" color="text.secondary">
          Why matched: {explanation}
        </Typography>
      )}
      {matchCoveragePercent !== undefined && (
        <Typography variant="caption" color="text.secondary">
          Match coverage (deterministic): {matchCoveragePercent}%
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
