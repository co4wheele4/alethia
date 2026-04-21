/**
 * SearchResultList — deterministic listing; optional match coverage is not semantic ranking.
 */

'use client';

import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { SearchResultExplanation } from './SearchResultExplanation';

export interface SearchResult {
  id: string;
  title: string;
  snippet?: string;
  explanation?: string;
  /** Optional; deterministic substring/filter coverage only — not semantic ranking. */
  matchCoveragePercent?: number;
  matchedTerms?: string[];
}

export interface SearchResultListProps {
  // TODO: Define props
  results?: SearchResult[];
  onResultClick?: (resultId: string) => void;
}

export function SearchResultList(props: SearchResultListProps) {
  const { results = [], onResultClick } = props;

  return (
    <List>
      {results.length === 0 && (
        <ListItem>
          <ListItemText primary="No results found" />
        </ListItem>
      )}
      {results.map((result) => (
        <ListItem
          key={result.id}
          onClick={() => onResultClick?.(result.id)}
          sx={{ cursor: onResultClick ? 'pointer' : 'default' }}
        >
          <ListItemText
            primary={result.title}
            secondary={
              <>
                {result.snippet && <Typography variant="body2">{result.snippet}</Typography>}
                <SearchResultExplanation
                  explanation={result.explanation}
                  matchCoveragePercent={result.matchCoveragePercent}
                  matchedTerms={result.matchedTerms}
                />
              </>
            }
            secondaryTypographyProps={{ component: 'div' }}
          />
        </ListItem>
      ))}
    </List>
  );
}
