'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { useEntities, type EntityListItem } from '../hooks/useEntities';

function groupByType(entities: EntityListItem[]) {
  const byType = new Map<string, EntityListItem[]>();
  for (const e of entities) {
    const k = e.type || 'unknown';
    byType.set(k, [...(byType.get(k) ?? []), e]);
  }
  return [...byType.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function EntityList() {
  const { entities, loading, error } = useEntities();
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [visibleByType, setVisibleByType] = useState<Record<string, number>>({});

  const types = useMemo(() => {
    const uniq = new Set<string>();
    for (const e of entities) uniq.add(e.type || 'unknown');
    return [...uniq].sort((a, b) => a.localeCompare(b));
  }, [entities]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entities.filter((e) => {
      if (typeFilter && (e.type || 'unknown') !== typeFilter) return false;
      if (!query) return true;
      return e.name.toLowerCase().includes(query);
    });
  }, [entities, q, typeFilter]);

  const grouped = useMemo(() => groupByType(filtered), [filtered]);

  return (
    <ContentSurface>
      <Typography variant="h6" gutterBottom>
        Entities (extracted)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Entities are extracted from evidence. This view does not assert correctness; inspect mentions before relying
        on any entity.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2 }}>
        <TextField
          label="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
          fullWidth
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label="All types"
            size="small"
            variant={typeFilter === null ? 'filled' : 'outlined'}
            color={typeFilter === null ? 'primary' : 'default'}
            onClick={() => setTypeFilter(null)}
          />
          {types.map((t) => (
            <Chip
              key={t}
              label={t}
              size="small"
              variant={typeFilter === t ? 'filled' : 'outlined'}
              color={typeFilter === t ? 'primary' : 'default'}
              onClick={() => setTypeFilter((prev) => (prev === t ? null : t))}
            />
          ))}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Loading extracted entities…
          </Typography>
          <LinearProgress />
        </Box>
      ) : null}

      {!loading && entities.length === 0 ? (
        <Alert severity="info">No entities yet. Ingest documents and inspect chunks to drive extraction.</Alert>
      ) : null}

      {!loading && entities.length > 0 && filtered.length === 0 ? (
        <Alert severity="info">No entities match your filters.</Alert>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {grouped.map(([type, list]) => (
          <Box key={type}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {type} ({list.length})
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Rendering is capped client-side. (API does not provide pagination parameters.)
            </Typography>
            <List dense aria-label={`entities-${type}`}>
              {list
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, visibleByType[type] ?? 50)
                .map((e) => (
                  <ListItemButton key={e.id} component={Link} href={`/entities/${e.id}`} sx={{ borderRadius: 1 }}>
                    <ListItemText primary={e.name} secondary={`Type: ${e.type || 'unknown'}`} />
                  </ListItemButton>
                ))}
            </List>

            {list.length > (visibleByType[type] ?? 50) ? (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                  onClick={() =>
                    setVisibleByType((prev) => ({
                      ...prev,
                      [type]: (prev[type] ?? 50) + 50,
                    }))
                  }
                >
                  Load more
                </Button>
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
    </ContentSurface>
  );
}

