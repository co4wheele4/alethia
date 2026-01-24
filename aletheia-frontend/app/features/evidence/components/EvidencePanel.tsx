'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { LadyJusticeProgressIndicator } from '../../../components/primitives/LadyJusticeProgressIndicator';
import { useDocuments } from '../../documents/hooks/useDocuments';
import { type DocumentChunkItem } from '../../documents/hooks/useDocumentChunks';
import { EvidenceComparisonView } from './EvidenceComparisonView';
import { EvidenceHighlightLayer } from './EvidenceHighlightLayer';
import { SelectedDocumentHeaderQueryContainer } from '../../documents/components/SelectedDocumentHeaderQueryContainer';
import { SelectedDocumentChunksQueryContainer } from '../../documents/components/SelectedDocumentChunksQueryContainer';

function sortChunks(chunks: DocumentChunkItem[]) {
  return chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex);
}

export function EvidencePanel(props: { userId: string | null }) {
  const { userId } = props;
  const { documents, loading: docsLoading, error: docsError } = useDocuments(userId);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(25);
  const [visibleChunksCount, setVisibleChunksCount] = useState(60);

  const activeDocumentId = useMemo(() => {
    if (selectedDocumentId && documents.some((d) => d.id === selectedDocumentId)) return selectedDocumentId;
    return documents[0]?.id ?? null;
  }, [documents, selectedDocumentId]);

  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [focusedChunkIndex, setFocusedChunkIndex] = useState<number | null>(null);

  if (!userId) {
    return <Alert severity="info">Evidence inspection is available after login.</Alert>;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '380px 1fr' }, gap: 2 }}>
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Evidence
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Evidence is chunk-level, immutable text snapshots. This view is read-only by design.
        </Typography>

        {docsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {docsError.message}
          </Alert>
        ) : null}

        {docsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <LadyJusticeProgressIndicator size={18} />
            <Typography variant="body2">Loading documents…</Typography>
          </Box>
        ) : null}

        <Typography variant="subtitle2" gutterBottom>
          Documents
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Showing {Math.min(visibleDocumentsCount, documents.length)} of {documents.length}. (API does not provide pagination parameters.)
        </Typography>
        <List dense aria-label="evidence-documents">
          {documents.slice(0, visibleDocumentsCount).map((d) => (
            <ListItemButton
              key={d.id}
              selected={d.id === activeDocumentId}
              onClick={() => {
                setSelectedDocumentId(d.id);
                setSelectedForCompare([]);
                setFocusedChunkIndex(null);
              }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText primary={d.title} secondary={new Date(d.createdAt).toLocaleString()} />
            </ListItemButton>
          ))}
        </List>
        {documents.length > visibleDocumentsCount ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setVisibleDocumentsCount((v) => v + 25)}>
              Load more documents
            </Button>
          </Box>
        ) : null}

        <Divider sx={{ my: 2 }} />

        <TextField
          label="Search within chunks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          Search is literal string match. No semantic expansion is applied.
        </Typography>
      </ContentSurface>

      <SelectedDocumentHeaderQueryContainer documentId={activeDocumentId}>
        {({ document, loading: docLoading, error: docError }) => (
          <SelectedDocumentChunksQueryContainer documentId={activeDocumentId}>
            {({ chunks, loading: chunksLoading, error: chunksError }) => {
              const loading = docLoading || chunksLoading;
              const error = docError ?? chunksError;

              const sorted = sortChunks(chunks);
              const filteredChunks = (() => {
                const q = query.trim().toLowerCase();
                if (!q) return sorted;
                return sorted.filter((c) => c.content.toLowerCase().includes(q));
              })();

              const focusedChunk = (() => {
                if (focusedChunkIndex === null) return null;
                return sorted.find((c) => c.chunkIndex === focusedChunkIndex) ?? null;
              })();

              const compare = (() => {
                const [a, b] = selectedForCompare;
                return {
                  left: typeof a === 'number' ? sorted.find((c) => c.chunkIndex === a) ?? null : null,
                  right: typeof b === 'number' ? sorted.find((c) => c.chunkIndex === b) ?? null : null,
                };
              })();

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <ContentSurface>
                    {error ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error.message}
                      </Alert>
                    ) : null}

                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                        <LadyJusticeProgressIndicator size={18} />
                        <Typography variant="body2">Loading chunks…</Typography>
                      </Box>
                    ) : null}

                    <Typography variant="subtitle2" gutterBottom>
                      Chunks
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Showing {Math.min(visibleChunksCount, filteredChunks.length)} of {filteredChunks.length}. (API does not provide pagination parameters.)
                    </Typography>

                    {!loading && sorted.length === 0 ? (
                      <Alert severity="info">No chunks available for this document.</Alert>
                    ) : null}

                    <List dense aria-label="evidence-chunks">
                      {filteredChunks.slice(0, visibleChunksCount).map((c) => {
                        const checked = selectedForCompare.includes(c.chunkIndex);
                        return (
                          <ListItemButton
                            key={c.id}
                            selected={focusedChunkIndex === c.chunkIndex}
                            onClick={() => setFocusedChunkIndex(c.chunkIndex)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                edge="start"
                                checked={checked}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-label': `select chunk ${c.chunkIndex} for comparison` }}
                                onChange={() => {
                                  setSelectedForCompare((prev) => {
                                    const next = prev.includes(c.chunkIndex)
                                      ? prev.filter((x) => x !== c.chunkIndex)
                                      : [...prev, c.chunkIndex];
                                    return next.slice(0, 2);
                                  });
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={`Chunk ${c.chunkIndex}`}
                              secondary={`${c.mentions?.length ?? 0} mentions`}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                    {filteredChunks.length > visibleChunksCount ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button size="small" variant="outlined" sx={{ textTransform: 'none' }} onClick={() => setVisibleChunksCount((v) => v + 60)}>
                          Load more chunks
                        </Button>
                      </Box>
                    ) : null}

                    {selectedForCompare.length > 0 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'none' }}
                          onClick={() => setSelectedForCompare([])}
                        >
                          Clear comparison selection
                        </Button>
                      </Box>
                    ) : null}
                  </ContentSurface>

                  <ContentSurface>
                    <EvidenceComparisonView document={document} left={compare.left} right={compare.right} query={query} />

                    <Typography variant="subtitle2" gutterBottom>
                      Focused chunk
                    </Typography>
                    {focusedChunk ? (
                      <EvidenceHighlightLayer text={focusedChunk.content} query={query} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Select a chunk to inspect its full content.
                      </Typography>
                    )}
                  </ContentSurface>
                </Box>
              );
            }}
          </SelectedDocumentChunksQueryContainer>
        )}
      </SelectedDocumentHeaderQueryContainer>
    </Box>
  );
}

