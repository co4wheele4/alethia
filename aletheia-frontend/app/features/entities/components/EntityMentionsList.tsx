/**
 * EntityMentionsList
 *
 * Evidence-first mention rendering for a single entity:
 * - All mentions (one row per mention record)
 * - Source document
 * - Chunk index
 * - Immutable chunk text (no summaries)
 *
 * Limitations (explicit):
 * - API does not provide exact span offsets for mentions, so “exact text span” is shown as unknown.
 */
'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { EntityMention } from '../hooks/useEntity';
import { EvidenceTextWithEntityHighlights } from '../../evidence/components/EvidenceTextWithEntityHighlights';

function excerpt(text: string, max = 220) {
  const s = text.trim().replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export function EntityMentionsList(props: {
  entityId: string;
  entityName: string;
  entityType: string;
  mentions: EntityMention[];
}) {
  const { entityId, entityName, entityType, mentions } = props;
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return mentions;
    return mentions.filter((m) => m.chunk.content.toLowerCase().includes(query));
  }, [mentions, q]);

  const mentionCount = mentions.length;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Mentions (evidence only)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each mention links to a specific document chunk. No summaries are shown here.
      </Typography>

      <Alert severity="warning" sx={{ mb: 2 }}>
        Exact text spans are <strong>unknown</strong>: the current API does not provide mention start/end offsets.
      </Alert>

      <TextField
        label="Filter mentions by literal text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Filter is a literal substring match over chunk text. No semantic expansion is applied.
      </Typography>

      {mentions.length === 0 ? <Alert severity="info">No mentions are available for this entity.</Alert> : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {filtered.map((m) => {
          const doc = m.chunk.document;
          const chunkIndex = m.chunk.chunkIndex;
          return (
            <Accordion key={m.id} disableGutters elevation={0} sx={{ bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {doc.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    Chunk {chunkIndex} • Document date added: {new Date(doc.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    Open in viewer: <Link href={`/documents?documentId=${doc.id}&chunk=${chunkIndex}`}>Documents</Link>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                    Preview: {excerpt(m.chunk.content)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Entity: {entityName} • Type: {entityType || 'unknown'} • Confidence: unknown • Mentions (entity):{' '}
                  {mentionCount}
                </Typography>
                <EvidenceTextWithEntityHighlights
                  text={m.chunk.content}
                  entities={[
                    { id: entityId, name: entityName, type: entityType, mentionCount, confidence: null },
                  ]}
                />
              </AccordionDetails>
            </Accordion>
          );
        })}

        {mentions.length > 0 && filtered.length === 0 ? (
          <Alert severity="info">No mentions match your filter.</Alert>
        ) : null}
      </Box>
    </Box>
  );
}

