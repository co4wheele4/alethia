'use client';

import Link from 'next/link';
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import type { EntityDetail } from '../hooks/useEntity';

/**
 * EntityRelationshipGraph
 *
 * Purposefully not a “graph visualization” yet: we avoid introducing a force graph
 * that can imply structure or confidence not supported by evidence/UX.
 *
 * This component renders relationships as explicit, inspectable edges.
 */
export function EntityRelationshipGraph(props: { entity: EntityDetail }) {
  const { entity } = props;

  const outgoing = entity.outgoing ?? [];
  const incoming = entity.incoming ?? [];

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Relationships (extracted)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Relationships are extracted assertions. Treat them as hypotheses unless you can trace them to concrete
        mentions.
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Supporting evidence for relationships is <strong>missing</strong> in the current API. The UI does not
        auto-resolve contradictions.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Outgoing
          </Typography>
          <List dense aria-label="entity-outgoing">
            {outgoing.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No outgoing relationships.
              </Typography>
            ) : (
              outgoing.map((rel) => (
                <Link key={rel.id} href={`/entities/${rel.to.id}`} passHref legacyBehavior>
                  <ListItemButton component="a" sx={{ borderRadius: 1 }}>
                    <ListItemText primary={`${rel.relation} → ${rel.to.name}`} secondary={`Type: ${rel.to.type}`} />
                  </ListItemButton>
                </Link>
              ))
            )}
          </List>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Incoming
          </Typography>
          <List dense aria-label="entity-incoming">
            {incoming.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No incoming relationships.
              </Typography>
            ) : (
              incoming.map((rel) => (
                <Link key={rel.id} href={`/entities/${rel.from.id}`} passHref legacyBehavior>
                  <ListItemButton component="a" sx={{ borderRadius: 1 }}>
                    <ListItemText primary={`${rel.from.name} → ${rel.relation}`} secondary={`Type: ${rel.from.type}`} />
                  </ListItemButton>
                </Link>
              ))
            )}
          </List>
        </Box>
      </Box>
    </Box>
  );
}

