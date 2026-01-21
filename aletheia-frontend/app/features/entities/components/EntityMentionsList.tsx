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
 * - Some mentions may be legacy (no spans). When spans are missing, exact highlights are unavailable.
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
  Button,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import type { EntityMention } from '../hooks/useEntity';
import { EvidenceHighlightLayer } from '../../evidence/components/EvidenceHighlightLayer';

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
  const { entityName, entityType, mentions } = props;
  const [q, setQ] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return mentions;
    return mentions.filter((m) => m.chunk.content.toLowerCase().includes(query));
  }, [mentions, q]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const canLoadMore = filtered.length > visible.length;

  const mentionCount = mentions.length;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Mentions (evidence only)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each mention links to a specific document chunk. No summaries are shown here.
      </Typography>
      {mentions.some((m) => m.startOffset == null || m.endOffset == null) ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Some mentions have <strong>unknown</strong> exact spans (legacy data). When spans are missing, highlights are
          unavailable.
        </Alert>
      ) : null}

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
        {visible.map((m) => {
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
                  Entity: {entityName} • Type: {entityType || 'unknown'} • Mentions (entity): {mentionCount}
                </Typography>
                <EvidenceHighlightLayer
                  text={m.chunk.content}
                  ranges={
                    typeof m.startOffset === 'number' && typeof m.endOffset === 'number'
                      ? [{ start: m.startOffset, end: m.endOffset }]
                      : undefined
                  }
                />
              </AccordionDetails>
            </Accordion>
          );
        })}

        {mentions.length > 0 && filtered.length === 0 ? (
          <Alert severity="info">No mentions match your filter.</Alert>
        ) : null}
      </Box>

      {canLoadMore ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setVisibleCount((v) => v + 20)}>
            Load more mentions
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

