/**
 * EntityMentionsList
 *
 * Evidence-first mention rendering for a single entity:
 * - One row per **unique evidence span** (chunk + offsets). If duplicate rows ever exist for the same span
 *   (e.g. older DBs), they are merged for display; the database now enforces uniqueness on anchored spans.
 * - Source document, chunk index, immutable chunk text (no summaries)
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
  Chip,
  Stack,
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

function chunkPrimaryKey(m: EntityMention): string {
  // GraphQL includes `chunkId`; some tests only set `chunk.id`.
  return m.chunkId || m.chunk.id;
}

/** Stable key for “same highlight location” deduplication. */
function mentionEvidenceKey(m: EntityMention): string {
  const ck = chunkPrimaryKey(m);
  return `${ck}:${m.startOffset}:${m.endOffset}`;
}

type MentionEvidenceGroup = {
  representative: EntityMention;
  /** Number of DB rows merged into this row (≥ 1). */
  rowCount: number;
};

function groupMentionsByEvidenceSpan(mentions: EntityMention[]): MentionEvidenceGroup[] {
  const byKey = new Map<string, EntityMention[]>();
  for (const m of mentions) {
    const k = mentionEvidenceKey(m);
    const arr = byKey.get(k) ?? [];
    arr.push(m);
    byKey.set(k, arr);
  }
  const groups: MentionEvidenceGroup[] = [];
  for (const arr of byKey.values()) {
    arr.sort((a, b) => a.id.localeCompare(b.id));
    const [representative] = arr;
    groups.push({ representative, rowCount: arr.length });
  }
  groups.sort((a, b) => {
    const A = a.representative;
    const B = b.representative;
    const t = A.chunk.document.title.localeCompare(B.chunk.document.title);
    if (t !== 0) return t;
    if (A.chunk.chunkIndex !== B.chunk.chunkIndex) return A.chunk.chunkIndex - B.chunk.chunkIndex;
    return A.startOffset - B.startOffset;
  });
  return groups;
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

  const groups = useMemo(() => groupMentionsByEvidenceSpan(filtered), [filtered]);

  const visible = useMemo(() => groups.slice(0, visibleCount), [groups, visibleCount]);
  const canLoadMore = groups.length > visible.length;

  const persistedMentionRowCount = mentions.length;
  const uniqueLocationCount = useMemo(() => groupMentionsByEvidenceSpan(mentions).length, [mentions]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Mentions (evidence only)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each row is one evidence location (document chunk + character span). Multiple database mention rows that
        point at the same span are shown once. No summaries are shown here.
      </Typography>
      {persistedMentionRowCount !== uniqueLocationCount ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          This entity has <strong>{persistedMentionRowCount}</strong> persisted mention record
          {persistedMentionRowCount === 1 ? '' : 's'} across <strong>{uniqueLocationCount}</strong> unique location
          {uniqueLocationCount === 1 ? '' : 's'}.           Duplicate rows usually predate the database unique constraint on (entity, chunk, span).
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
        {visible.map(({ representative: m, rowCount }) => {
          const doc = m.chunk.document;
          const chunkIndex = m.chunk.chunkIndex;
          return (
            <Accordion
              key={mentionEvidenceKey(m)}
              disableGutters
              elevation={0}
              sx={{ bgcolor: 'transparent' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {doc.title}
                    </Typography>
                    {rowCount > 1 ? (
                      <Chip size="small" label={`${rowCount} duplicate DB rows`} variant="outlined" />
                    ) : null}
                  </Stack>
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
                  Entity: {entityName} • Type: {entityType || 'unknown'} • Representative mention id:{' '}
                  <code style={{ fontSize: '0.85em' }}>{m.id}</code>
                  {rowCount > 1 ? (
                    <>
                      {' '}
                      • <strong>{rowCount}</strong> persisted rows share this span
                    </>
                  ) : null}
                </Typography>
                <EvidenceHighlightLayer
                  text={m.chunk.content}
                  ranges={[{ start: m.startOffset, end: m.endOffset }]}
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

