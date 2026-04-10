'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@apollo/client/react';

import { AppShell } from '../components/layout/AppShell';
import { SEARCH_CLAIMS_QUERY } from '@/src/graphql/queries/searchClaims.query';

/** ADR-033: Match mode (no fuzzy / similarity). */
type TextMatchModeGql = 'EXACT' | 'PREFIX' | 'SUBSTRING';

/** ADR-033: Deterministic ordering only. */
type DeterministicOrderByGql =
  | 'CREATED_AT_ASC'
  | 'CREATED_AT_DESC'
  | 'ID_ASC'
  | 'ID_DESC';

type SearchClaimsData = {
  searchClaims: Array<{
    id: string;
    text: string;
    status: string;
    createdAt: string;
  }>;
};

type SearchClaimRow = SearchClaimsData['searchClaims'][number];

export default function SearchPage() {
  const [queryText, setQueryText] = useState('');
  const [matchMode, setMatchMode] = useState<TextMatchModeGql>('SUBSTRING');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [orderBy, setOrderBy] =
    useState<DeterministicOrderByGql>('CREATED_AT_ASC');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const variables = useMemo(
    () => ({
      input: {
        queryText,
        matchMode,
        caseSensitive,
        orderBy,
        limit,
        offset,
      },
    }),
    [queryText, matchMode, caseSensitive, orderBy, limit, offset],
  );

  const { data, loading, error, refetch } = useQuery<SearchClaimsData>(
    SEARCH_CLAIMS_QUERY,
    {
      variables,
      fetchPolicy: 'network-only',
    },
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      void refetch(variables);
    },
    [refetch, variables],
  );

  const rows = data?.searchClaims ?? [];

  return (
    <AppShell title="Search claims" requireAuth>
      <Typography variant="h4" component="h1" gutterBottom>
        Search claims
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Structural text match and filters only. Results use the order you select (created time or
        id). This page does not rank by match quality.
      </Typography>

      <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 720 }}>
        <Stack spacing={2}>
          <TextField
            label="Text"
            value={queryText}
            onChange={(ev) => setQueryText(ev.target.value)}
            fullWidth
            helperText="Empty applies structural filters only (no text predicate)."
            aria-label="claim-search-text"
          />
          <FormControl fullWidth>
            <InputLabel id="match-mode-label">Match mode</InputLabel>
            <Select
              labelId="match-mode-label"
              label="Match mode"
              value={matchMode}
              onChange={(ev) =>
                setMatchMode(ev.target.value as TextMatchModeGql)
              }
              aria-label="claim-search-match-mode"
            >
              <MenuItem value="EXACT">Exact</MenuItem>
              <MenuItem value="PREFIX">Prefix</MenuItem>
              <MenuItem value="SUBSTRING">Substring</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="case-label">Case</InputLabel>
            <Select
              labelId="case-label"
              label="Case"
              value={caseSensitive ? 'sensitive' : 'insensitive'}
              onChange={(ev) =>
                setCaseSensitive(ev.target.value === 'sensitive')
              }
              aria-label="claim-search-case"
            >
              <MenuItem value="insensitive">Case-insensitive</MenuItem>
              <MenuItem value="sensitive">Case-sensitive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="order-label">Order</InputLabel>
            <Select
              labelId="order-label"
              label="Order"
              value={orderBy}
              onChange={(ev) =>
                setOrderBy(ev.target.value as DeterministicOrderByGql)
              }
              aria-label="claim-search-order"
            >
              <MenuItem value="CREATED_AT_ASC">Created time (oldest first)</MenuItem>
              <MenuItem value="CREATED_AT_DESC">Created time (newest first)</MenuItem>
              <MenuItem value="ID_ASC">Id ascending</MenuItem>
              <MenuItem value="ID_DESC">Id descending</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Limit"
              type="number"
              value={limit}
              onChange={(ev) => setLimit(Number(ev.target.value) || 1)}
              inputProps={{ min: 1, max: 200 }}
              aria-label="claim-search-limit"
            />
            <TextField
              label="Offset"
              type="number"
              value={offset}
              onChange={(ev) => setOffset(Math.max(0, Number(ev.target.value) || 0))}
              inputProps={{ min: 0 }}
              aria-label="claim-search-offset"
            />
          </Stack>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
        </Stack>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      <List aria-label="claim-search-results" sx={{ mt: 2 }}>
        {rows.map((c: SearchClaimRow) => (
          <ListItem key={c.id} divider>
            <ListItemText
              primary={c.text}
              secondary={`${c.status} · ${c.createdAt}`}
            />
          </ListItem>
        ))}
      </List>
    </AppShell>
  );
}
