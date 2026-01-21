'use client';

import Link from 'next/link';
import { useApolloClient } from '@apollo/client/react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';

import { ContentSurface } from '../../../components/layout';
import { useDocuments, type DocumentListItem } from '../../documents/hooks/useDocuments';
import { CHUNK0_BY_DOCUMENT_QUERY } from '../../documents/graphql';
import { parseProvenanceFromChunk0 } from '../../documents/provenance';
import { useChunksByDocument } from '../../documents/hooks/useDocumentChunks';
import { useEntities } from '../../entities/hooks/useEntities';
import { useEntity, type EntityMention, type EntityRelationship } from '../../entities/hooks/useEntity';
import { EvidenceHighlightLayer } from './EvidenceHighlightLayer';

type Chunk0Result = {
  chunk0ByDocument: {
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
    document: { __typename?: 'Document'; id: string; title: string; createdAt: string };
  } | null;
};
type Chunk0Vars = { documentId: string };

type SourceBadge = {
  sourceKind: string;
  provenanceType?: string | null;
  provenanceLabel?: string | null;
  provenanceConfirmed?: boolean | null;
  ingestedAt?: string | null;
};

function sourceBadgeOf(chunk0Content: string | null): SourceBadge | null {
  if (!chunk0Content) return null;
  const parsed = parseProvenanceFromChunk0(chunk0Content);
  const prov = parsed.provenance;
  if (!prov?.source) return null;

  const src = prov.source as Record<string, unknown>;
  return {
    sourceKind: String(src.kind ?? 'unknown'),
    provenanceType: (src.provenanceType as string | null | undefined) ?? null,
    provenanceLabel: (src.provenanceLabel as string | null | undefined) ?? null,
    provenanceConfirmed: (src.provenanceConfirmed as boolean | null | undefined) ?? null,
    ingestedAt: (prov.ingestedAt as string | null | undefined) ?? null,
  };
}

function excerpt(text: string, start: number | null, end: number | null, fallbackMax = 220) {
  const s = text ?? '';
  if (typeof start === 'number' && typeof end === 'number' && end > start && start >= 0) {
    const pad = 80;
    const a = Math.max(0, start - pad);
    const b = Math.min(s.length, end + pad);
    return s.slice(a, b).replace(/\s+/g, ' ').trim();
  }
  return s.trim().replace(/\s+/g, ' ').slice(0, fallbackMax) + (s.length > fallbackMax ? '…' : '');
}

export function EvidenceExplorer(props: { userId: string | null }) {
  const { userId } = props;
  const apollo = useApolloClient();

  const { documents, loading: docsLoading, error: docsError } = useDocuments(userId);
  const { entities, loading: entitiesLoading, error: entitiesError } = useEntities();

  const [docQuery, setDocQuery] = useState('');
  const [entityQuery, setEntityQuery] = useState('');
  const [visibleDocumentsCount, setVisibleDocumentsCount] = useState(25);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [selectedRelationship, setSelectedRelationship] = useState<{
    direction: 'outgoing' | 'incoming';
    relationship: EntityRelationship;
  } | null>(null);
  const [selectedRelationshipEvidenceId, setSelectedRelationshipEvidenceId] = useState<string | null>(null);

  const [selectedEvidence, setSelectedEvidence] = useState<{
    kind: 'mention' | 'relationship-evidence';
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    chunkContent: string;
    startOffset: number | null;
    endOffset: number | null;
    label: string;
  } | null>(null);

  const [sourceByDocumentId, setSourceByDocumentId] = useState<Record<string, SourceBadge | null | undefined>>({});

  const filteredDocuments = useMemo(() => {
    const q = docQuery.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, docQuery]);

  const filteredEntities = useMemo(() => {
    const q = entityQuery.trim().toLowerCase();
    if (!q) return entities;
    return entities.filter((e) => e.name.toLowerCase().includes(q));
  }, [entities, entityQuery]);

  const activeDocumentId = useMemo(() => {
    if (selectedDocumentId && documents.some((d) => d.id === selectedDocumentId)) return selectedDocumentId;
    return documents[0]?.id ?? null;
  }, [documents, selectedDocumentId]);

  const activeEntityId = useMemo(() => {
    if (selectedEntityId && entities.some((e) => e.id === selectedEntityId)) return selectedEntityId;
    return entities[0]?.id ?? null;
  }, [entities, selectedEntityId]);

  const docDetail = useChunksByDocument(activeDocumentId);
  const entityDetail = useEntity(activeEntityId);

  // Prefetch provenance chunk-0 for visible documents (index-safe).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const run = async () => {
      const slice = filteredDocuments.slice(0, visibleDocumentsCount);
      for (const d of slice) {
        if (cancelled) return;
        if (sourceByDocumentId[d.id] !== undefined) continue;
        try {
          const res = await apollo.query<Chunk0Result, Chunk0Vars>({
            query: CHUNK0_BY_DOCUMENT_QUERY,
            variables: { documentId: d.id },
            fetchPolicy: 'cache-first',
          });
          const badge = sourceBadgeOf(res.data?.chunk0ByDocument?.content ?? null);
          if (!cancelled) {
            setSourceByDocumentId((prev) => ({ ...prev, [d.id]: badge }));
          }
        } catch {
          if (!cancelled) {
            setSourceByDocumentId((prev) => ({ ...prev, [d.id]: null }));
          }
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [apollo, filteredDocuments, sourceByDocumentId, userId, visibleDocumentsCount]);

  const docChunksSorted = useMemo(() => docDetail.chunks.slice().sort((a, b) => a.chunkIndex - b.chunkIndex), [docDetail.chunks]);

  const relationshipEdges = useMemo(() => {
    const e = entityDetail.entity;
    if (!e) return { outgoing: [] as EntityRelationship[], incoming: [] as EntityRelationship[] };
    return { outgoing: e.outgoing as EntityRelationship[], incoming: e.incoming as EntityRelationship[] };
  }, [entityDetail.entity]);

  if (!userId) {
    return <Alert severity="info">Evidence exploration is available after login.</Alert>;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px 1fr', xl: '360px 1fr 520px' }, gap: 2 }}>
      {/* Left: Indexes */}
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Evidence Explorer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click to reduce abstraction: documents → chunks → offsets. No summaries; evidence stays visible.
        </Typography>

        {docsError || entitiesError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(docsError ?? entitiesError)!.message}
          </Alert>
        ) : null}

        {docsLoading || entitiesLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Box>
        ) : null}

        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Document Index
        </Typography>
        <TextField
          label="Filter documents"
          value={docQuery}
          onChange={(e) => setDocQuery(e.target.value)}
          size="small"
          fullWidth
          sx={{ my: 1 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Source type is read from chunk 0 provenance (no inference).
        </Typography>
        <List dense aria-label="explorer-documents">
          {filteredDocuments.slice(0, visibleDocumentsCount).map((d: DocumentListItem) => {
            const badge = sourceByDocumentId[d.id];
            const secondary = (() => {
              const parts: string[] = [new Date(d.createdAt).toLocaleString()];
              if (badge?.sourceKind) parts.push(`source: ${badge.sourceKind}`);
              if (badge?.provenanceType) parts.push(`provenance: ${badge.provenanceType}`);
              return parts.join(' • ');
            })();
            return (
              <ListItemButton
                key={d.id}
                selected={d.id === activeDocumentId}
                onClick={() => {
                  setSelectedDocumentId(d.id);
                  setSelectedEvidence(null);
                  setSelectedRelationship(null);
                  setSelectedRelationshipEvidenceId(null);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={d.title}
                  secondary={secondary}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            );
          })}
        </List>
        {filteredDocuments.length > visibleDocumentsCount ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Chip
              label="Load more"
              variant="outlined"
              onClick={() => setVisibleDocumentsCount((v) => v + 25)}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        ) : null}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Entity List
        </Typography>
        <TextField
          label="Filter entities"
          value={entityQuery}
          onChange={(e) => setEntityQuery(e.target.value)}
          size="small"
          fullWidth
          sx={{ my: 1 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Mention counts are inspectable: click an entity to view every mention row.
        </Typography>
        <List dense aria-label="explorer-entities">
          {filteredEntities.slice(0, 60).map((e) => (
            <ListItemButton
              key={e.id}
              selected={e.id === activeEntityId}
              onClick={() => {
                setSelectedEntityId(e.id);
                setSelectedEvidence(null);
                setSelectedRelationship(null);
                setSelectedRelationshipEvidenceId(null);
              }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText
                primary={e.name}
                secondary={`Type: ${e.type || 'unknown'} • Mentions: ${e.mentionCount ?? 0}`}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      </ContentSurface>

      {/* Middle: Drill-down (document chunks + entity/relationship) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <ContentSurface>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }} gutterBottom>
            Document drill-down
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Pick a chunk to view it on the right. Counts are not conclusions; they only tell you where to click.
          </Typography>

          {docDetail.error ? <Alert severity="error">{docDetail.error.message}</Alert> : null}
          {docDetail.loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading chunks…</Typography>
            </Box>
          ) : null}

          <List dense aria-label="explorer-chunks">
            {docChunksSorted.slice(0, 80).map((c) => (
              <ListItemButton
                key={c.id}
                onClick={() => {
                  const doc = documents.find((d) => d.id === activeDocumentId);
                  if (!doc) return;
                  setSelectedEvidence({
                    kind: 'mention',
                    documentId: doc.id,
                    documentTitle: doc.title,
                    chunkIndex: c.chunkIndex,
                    chunkContent: c.content,
                    startOffset: null,
                    endOffset: null,
                    label: `Document chunk ${c.chunkIndex}`,
                  });
                      setSelectedRelationship(null);
                      setSelectedRelationshipEvidenceId(null);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={`Chunk ${c.chunkIndex}`}
                  secondary={`${c.mentions?.length ?? 0} mentions`}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
          </List>
          {docChunksSorted.length > 80 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              Chunk list is capped at 80 for responsiveness. Use the Documents view for full browsing.
            </Alert>
          ) : null}
        </ContentSurface>

        <ContentSurface>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }} gutterBottom>
            Entity drill-down
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Relationships are only meaningful if you can click through to evidence anchors.
          </Typography>

          {entityDetail.error ? <Alert severity="error">{entityDetail.error.message}</Alert> : null}
          {entityDetail.loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Loading entity…</Typography>
            </Box>
          ) : null}

          {entityDetail.entity ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 800 }}>
                  {entityDetail.entity.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Type: {entityDetail.entity.type || 'unknown'} • Mentions: {entityDetail.entity.mentionCount ?? 0}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Outgoing
                  </Typography>
                  <List dense aria-label="explorer-rel-outgoing">
                    {relationshipEdges.outgoing.map((rel) => (
                      <ListItemButton
                        key={rel.id}
                        onClick={() => {
                          setSelectedRelationship({ direction: 'outgoing', relationship: rel });
                          setSelectedRelationshipEvidenceId(null);
                          setSelectedEvidence(null);
                        }}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={`${rel.relation} → ${rel.to?.name ?? '—'}`}
                          secondary={`Evidence anchors: ${(rel.evidence ?? []).length}`}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Incoming
                  </Typography>
                  <List dense aria-label="explorer-rel-incoming">
                    {relationshipEdges.incoming.map((rel) => (
                      <ListItemButton
                        key={rel.id}
                        onClick={() => {
                          setSelectedRelationship({ direction: 'incoming', relationship: rel });
                          setSelectedRelationshipEvidenceId(null);
                          setSelectedEvidence(null);
                        }}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={`${rel.from?.name ?? '—'} → ${rel.relation}`}
                          secondary={`Evidence anchors: ${(rel.evidence ?? []).length}`}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Box>

              <Divider />

              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Relationship evidence anchors
              </Typography>
              {selectedRelationship ? (
                (selectedRelationship.relationship.evidence ?? []).length > 0 ? (
                  <List dense aria-label="explorer-relationship-evidence">
                    {(selectedRelationship.relationship.evidence ?? []).map((ev) => {
                      const start = typeof ev.startOffset === 'number' ? ev.startOffset : null;
                      const end = typeof ev.endOffset === 'number' ? ev.endOffset : null;
                      const selected = ev.id === selectedRelationshipEvidenceId;
                      return (
                        <ListItemButton
                          key={ev.id}
                          selected={selected}
                          onClick={() => {
                            setSelectedRelationshipEvidenceId(ev.id);
                            setSelectedEvidence({
                              kind: 'relationship-evidence',
                              documentId: ev.chunk.document.id,
                              documentTitle: ev.chunk.document.title,
                              chunkIndex: ev.chunk.chunkIndex,
                              chunkContent: ev.chunk.content,
                              startOffset: start,
                              endOffset: end,
                              label: `Relationship evidence (${selectedRelationship.relationship.relation})`,
                            });
                          }}
                          sx={{ borderRadius: 1 }}
                        >
                          <ListItemText
                            primary={`${ev.chunk.document.title} • chunk ${ev.chunk.chunkIndex}`}
                            secondary={`offsets: ${
                              start !== null && end !== null ? `${start}–${end}` : 'unknown'
                            } • created: ${new Date(ev.createdAt).toLocaleString()}`}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                ) : (
                  <Alert severity="warning">
                    This relationship has <strong>no</strong> evidence anchors in the current dataset. The UI will not
                    infer support.
                  </Alert>
                )
              ) : (
                <Alert severity="info">Select a relationship edge above to see its evidence anchors.</Alert>
              )}

              <Divider />

              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Mentions (click to open excerpt)
              </Typography>
              <List dense aria-label="explorer-entity-mentions">
                {entityDetail.entity.mentions.slice(0, 60).map((m: EntityMention) => {
                  const doc = m.chunk.document;
                  const start = typeof m.startOffset === 'number' ? m.startOffset : null;
                  const end = typeof m.endOffset === 'number' ? m.endOffset : null;
                  return (
                    <ListItemButton
                      key={m.id}
                      onClick={() =>
                        setSelectedEvidence({
                          kind: 'mention',
                          documentId: doc.id,
                          documentTitle: doc.title,
                          chunkIndex: m.chunk.chunkIndex,
                          chunkContent: m.chunk.content,
                          startOffset: start,
                          endOffset: end,
                          label: `Mention in chunk ${m.chunk.chunkIndex}`,
                        })
                      }
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemText
                        primary={`${doc.title} • chunk ${m.chunk.chunkIndex}`}
                        secondary={`offsets: ${
                          start !== null && end !== null ? `${start}–${end}` : 'unknown'
                        } • ${excerpt(m.chunk.content, start, end)}`}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
              {entityDetail.entity.mentions.length > 60 ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Mention list is capped at 60 here. Use the entity detail page for full browsing.
                </Alert>
              ) : null}
            </Box>
          ) : (
            <Alert severity="info">No entity selected.</Alert>
          )}
        </ContentSurface>
      </Box>

      {/* Right: Always-visible evidence panel */}
      <ContentSurface>
        <Typography variant="h6" gutterBottom>
          Evidence
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This panel never summarizes. It shows raw text, plus exact offsets when they exist.
        </Typography>

        {selectedEvidence ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              {selectedEvidence.label}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Document: {selectedEvidence.documentTitle} • Chunk: {selectedEvidence.chunkIndex} • Offsets:{' '}
              {selectedEvidence.startOffset !== null && selectedEvidence.endOffset !== null
                ? `${selectedEvidence.startOffset}–${selectedEvidence.endOffset}`
                : 'unknown'}
            </Typography>

            {(() => {
              const badge = sourceByDocumentId[selectedEvidence.documentId] ?? null;
              if (!badge) return null;
              return (
                <Alert severity="info">
                  Source: <strong>{badge.sourceKind}</strong>
                  {badge.provenanceType ? ` • Provenance: ${badge.provenanceType}` : ''}
                  {badge.provenanceLabel ? ` • Label: ${badge.provenanceLabel}` : ''}
                  {typeof badge.provenanceConfirmed === 'boolean'
                    ? ` • Confirmed: ${badge.provenanceConfirmed ? 'true' : 'false'}`
                    : ''}
                </Alert>
              );
            })()}

            <EvidenceHighlightLayer
              text={selectedEvidence.chunkContent}
              ranges={
                selectedEvidence.startOffset !== null && selectedEvidence.endOffset !== null
                  ? [{ start: selectedEvidence.startOffset, end: selectedEvidence.endOffset }]
                  : undefined
              }
            />

            <Typography variant="caption" color="text.secondary">
              Open in Documents viewer:{' '}
              <Link
                href={`/documents?documentId=${encodeURIComponent(selectedEvidence.documentId)}&chunk=${encodeURIComponent(
                  String(selectedEvidence.chunkIndex)
                )}`}
              >
                Documents
              </Link>
            </Typography>
          </Box>
        ) : (
          <Alert severity="info">
            {selectedRelationship
              ? 'Select an evidence anchor for the selected relationship to view it here.'
              : 'Select a mention, relationship evidence anchor, or chunk to view it here.'}
          </Alert>
        )}
      </ContentSurface>
    </Box>
  );
}

