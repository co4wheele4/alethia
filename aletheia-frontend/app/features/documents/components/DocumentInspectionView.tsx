/**
 * DocumentInspectionView
 *
 * Canonical Document Viewer layout:
 * - Left: chunk navigation
 * - Center: chunk text (immutable), with subtle entity highlighting
 * - Right: metadata panel (provenance + extracted entity index)
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Divider, Typography } from '@mui/material';

import type { DocumentChunkItem, DocumentHeader } from '../hooks/useDocumentChunks';
import { parseProvenanceFromChunk0 } from '../provenance';
import { EvidenceTextWithEntityHighlights, type HighlightableEntity } from '../../evidence/components/EvidenceTextWithEntityHighlights';
import { DocumentChunkNavigation } from './DocumentChunkNavigation';
import { DocumentEvidencePanel } from './DocumentEvidencePanel';

function buildHighlightEntities(chunks: DocumentChunkItem[]): HighlightableEntity[] {
  const byId = new Map<string, HighlightableEntity>();

  for (const c of chunks) {
    for (const m of c.mentions ?? []) {
      const e = m.entity;
      const prev = byId.get(e.id);
      byId.set(e.id, {
        id: e.id,
        name: e.name,
        type: e.type,
        mentionCount: (prev?.mentionCount ?? 0) + 1,
        confidence: null, // not provided by API
      });
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function DocumentInspectionView(props: {
  document: DocumentHeader | null;
  chunks: DocumentChunkItem[];
  initialChunkIndex?: number | null;
}) {
  const { document, chunks, initialChunkIndex } = props;
  const router = useRouter();

  const sorted = useMemo(() => chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex), [chunks]);
  const highlightEntities = useMemo(() => buildHighlightEntities(sorted), [sorted]);

  const initial = useMemo(() => {
    if (typeof initialChunkIndex === 'number' && sorted.some((c) => c.chunkIndex === initialChunkIndex)) {
      return initialChunkIndex;
    }
    return sorted[0]?.chunkIndex ?? null;
  }, [initialChunkIndex, sorted]);

  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number | null>(initial);

  useEffect(() => {
    setSelectedChunkIndex(initial);
  }, [initial]);

  const selectedChunk = useMemo(() => {
    if (selectedChunkIndex === null) return null;
    return sorted.find((c) => c.chunkIndex === selectedChunkIndex) ?? null;
  }, [sorted, selectedChunkIndex]);

  const selectedText = useMemo(() => {
    if (!selectedChunk) return '';
    if (selectedChunk.chunkIndex === 0) {
      const parsed0 = parseProvenanceFromChunk0(selectedChunk.content);
      // Provenance header is shown in the metadata panel; center pane defaults to evidence body.
      if (parsed0?.rawHeader) return parsed0.body;
    }
    return selectedChunk.content;
  }, [selectedChunk]);

  if (!document) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Inspect a document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a document on the left to view its chunked evidence and provenance.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px 1fr 360px' }, gap: 2, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <DocumentChunkNavigation
          chunks={sorted}
          selectedChunkIndex={selectedChunkIndex}
          onSelectChunkIndex={setSelectedChunkIndex}
        />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Evidence text
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Showing chunk {selectedChunk?.chunkIndex ?? '—'} (read-only). Click a highlighted entity to inspect its mentions.
        </Typography>

        <EvidenceTextWithEntityHighlights
          text={selectedText}
          entities={highlightEntities}
          onEntityClick={(entityId) => router.push(`/entities/${entityId}`)}
        />

        <Divider sx={{ my: 2 }} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <DocumentEvidencePanel document={document} chunks={sorted} />
      </Box>
    </Box>
  );
}

