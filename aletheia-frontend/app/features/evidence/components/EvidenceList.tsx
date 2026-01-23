'use client';

import { useMemo, useState } from 'react';
import { Alert, Box, List, ListItemButton, ListItemText, TextField, Typography } from '@mui/material';

import type { DocumentEntityRow, EvidenceDocument } from '../hooks/useDocumentEvidence';

type MentionRow = {
  mentionId: string;
  entityId: string;
  entityLabel: string;
  entityType: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  excerpt: string | null;
};

function excerptFallback(doc: EvidenceDocument, row: MentionRow) {
  const chunk = (doc.chunks ?? []).find((c) => c.chunkIndex === row.chunkIndex) ?? null;
  if (!chunk) return row.excerpt ?? '';
  return chunk.content.slice(row.startOffset, Math.min(chunk.content.length, row.endOffset)).replace(/\s+/g, ' ').trim();
}

export function EvidenceList(props: {
  document: EvidenceDocument | null;
  entities: DocumentEntityRow[];
  activeMentionId: string | null;
  onSelectMention: (mentionId: string) => void;
}) {
  const { document, entities, activeMentionId, onSelectMention } = props;
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const out: MentionRow[] = [];
    for (const e of entities) {
      for (const m of e.mentions) {
        out.push({
          mentionId: m.mentionId,
          entityId: e.entity.id,
          entityLabel: e.entity.name,
          entityType: e.entity.type,
          chunkIndex: m.chunkIndex,
          startOffset: m.startOffset,
          endOffset: m.endOffset,
          excerpt: m.excerpt ?? null,
        });
      }
    }
    out.sort((a, b) => a.chunkIndex - b.chunkIndex || a.startOffset - b.startOffset);
    return out;
  }, [entities]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) => {
      const hay = `${r.entityLabel} ${r.entityType} ${r.mentionId} ${r.excerpt ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, rows]);

  if (!document) return <Alert severity="info">Select a document to inspect evidence.</Alert>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Evidence list
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Each row is a concrete mention anchored by offsets (no inference).
        </Typography>
      </Box>

      <TextField
        label="Filter evidence"
        size="small"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        inputProps={{ 'aria-label': 'Filter evidence' }}
      />

      {filtered.length === 0 ? (
        <Alert severity="info">No evidence rows match this filter.</Alert>
      ) : (
        <List dense aria-label="evidence-list">
          {filtered.map((r) => (
            <ListItemButton
              key={r.mentionId}
              selected={r.mentionId === activeMentionId}
              onClick={() => onSelectMention(r.mentionId)}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText
                primary={`${r.entityLabel} (${r.entityType || '—'})`}
                secondary={`chunk ${r.chunkIndex} • offsets ${r.startOffset}–${r.endOffset} • ${document ? excerptFallback(document, r) : (r.excerpt ?? '')}`}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

