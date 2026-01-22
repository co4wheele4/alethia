'use client';

import { Alert, Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import { EvidenceSnippet } from './EvidenceSnippet';

type Relationship = {
  __typename?: 'EntityRelationship';
  id: string;
  relation: string;
  from: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
  to: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
  evidence: Array<Parameters<typeof EvidenceSnippet>[0]['evidence']>;
};

export function RelationshipEvidenceList(props: {
  relationships: Relationship[];
  selectedRelationshipId: string | null;
  onSelectRelationshipId: (id: string) => void;
}) {
  const { relationships, selectedRelationshipId, onSelectRelationshipId } = props;

  if (relationships.length === 0) {
    return <Alert severity="info">No relationships with evidence were linked to this document.</Alert>;
  }

  const selected = relationships.find((r) => r.id === selectedRelationshipId) ?? null;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '360px 1fr' }, gap: 2, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Relationships (evidence-linked)
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Relationships are shown only when explicit evidence anchors point into this document.
        </Typography>

        <List dense aria-label="document-relationships">
          {relationships.map((r) => (
            <ListItemButton
              key={r.id}
              selected={r.id === selectedRelationshipId}
              onClick={() => onSelectRelationshipId(r.id)}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText
                primary={`${r.from.name} —${r.relation}→ ${r.to.name}`}
                secondary={`Evidence: ${r.evidence.length}`}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Evidence snippets
        </Typography>

        {!selected ? (
          <Alert severity="info">Select a relationship to inspect its evidence.</Alert>
        ) : selected.evidence.length === 0 ? (
          <Alert severity="info">No evidence available for this relationship.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selected.evidence.map((ev) => (
              <EvidenceSnippet key={ev.id} evidence={ev} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

