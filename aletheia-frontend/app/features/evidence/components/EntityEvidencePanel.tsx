'use client';

/**
 * EntityEvidencePanel — offset-grounded mention display (ADR-020).
 * Verbatim excerpt from chunk; no summaries. Boundary integrity via explicit offsets.
 */
import { Alert, Box, Divider, List, ListItemButton, ListItemText, Typography } from '@mui/material';

import type { EvidenceDocument } from '../hooks/useDocumentEvidence';
import type { DocumentEntityMentionRow } from '../hooks/useDocumentEvidence';
import type { EvidenceChunk } from '../hooks/useDocumentEvidence';

function fail(message: string): never {
  throw new Error(`[Truth Surface] ${message}`);
}

/** Never throws — same contract as EvidenceDrawer: incomplete DB/cache must not crash /evidence. */
function formatProvenanceLine(doc: EvidenceDocument): string | null {
  const src = doc.source;
  if (!doc.sourceType || !doc.sourceLabel || !src) return null;

  const parts: string[] = [];
  parts.push(`sourceType=${String(doc.sourceType)}`);
  parts.push(`sourceLabel=${String(doc.sourceLabel)}`);
  parts.push(`kind=${String(src.kind)}`);
  if (src.requestedUrl) parts.push(`requestedUrl=${src.requestedUrl}`);
  if (src.fetchedUrl) parts.push(`fetchedUrl=${src.fetchedUrl}`);
  if (src.filename) parts.push(`filename=${src.filename}`);
  if (src.ingestedAt) parts.push(`ingestedAt=${src.ingestedAt}`);
  if (src.publishedAt) parts.push(`publishedAt=${src.publishedAt}`);
  return parts.join(' • ');
}

function mentionText(chunk: EvidenceChunk, m: DocumentEntityMentionRow) {
  const s = m.startOffset;
  const e = m.endOffset;
  if (s < 0 || e <= s || e > chunk.content.length) {
    fail(`Invalid offsets for mention ${m.mentionId} in chunk ${chunk.id}: [${s}, ${e})`);
  }
  return chunk.content.slice(s, e);
}

export function EntityEvidencePanel(props: {
  document: EvidenceDocument | null;
  selectedEntityId: string | null;
  mentions: DocumentEntityMentionRow[];
  chunksById: Record<string, EvidenceChunk>;
  onFocusChunkIndex?: (chunkIndex: number) => void;
}) {
  const { document, selectedEntityId, mentions, chunksById, onFocusChunkIndex } = props;

  if (!document) {
    return <Alert severity="info">Select a document to inspect entity evidence.</Alert>;
  }

  if (!selectedEntityId) {
    return <Alert severity="info">Select an entity to view explicit evidence (offsets + chunk linkage).</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Evidence
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          No summaries. Every highlight is an offset span into immutable chunk text.
        </Typography>
      </Box>

      <Alert severity={formatProvenanceLine(document) ? 'info' : 'warning'} data-testid="truth-provenance">
        <strong>{document.title}</strong>
        <div>
          {formatProvenanceLine(document) ?? (
            <>
              Source metadata is incomplete (expected <code>sourceType</code>, <code>sourceLabel</code>, and{' '}
              <code>Document.source</code>). Add a <code>document_sources</code> row or re-ingest this document.
            </>
          )}
        </div>
      </Alert>

      <Divider />

      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        Mentions for entity: {selectedEntityId}
      </Typography>

      <List dense aria-label="truth-entity-mentions">
        {mentions.map((m) => {
          const chunk = chunksById[m.chunkId];
          if (!chunk) {
            fail(`Missing chunk for mention ${m.mentionId}: chunkId=${m.chunkId}`);
          }

          const text = mentionText(chunk, m);
          if (m.excerpt !== null && m.excerpt !== undefined && m.excerpt !== text) {
            fail(
              `Mention excerpt mismatch for ${m.mentionId}: excerpt="${m.excerpt}" != chunk.slice="${text}" (chunk=${chunk.id})`
            );
          }

          return (
            <ListItemButton
              key={m.mentionId}
              onClick={() => onFocusChunkIndex?.(m.chunkIndex)}
              sx={{ borderRadius: 1 }}
              data-testid={`truth-mention-row-${m.mentionId}`}
            >
              <ListItemText
                primary={`Chunk ${m.chunkIndex} • offsets ${m.startOffset}–${m.endOffset}`}
                secondary={`chunkId=${m.chunkId} • "${text}"`}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

