'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Alert, Box, Divider, LinearProgress, Stack } from '@mui/material';

import { GET_DOCUMENT_INTELLIGENCE_QUERY } from '@/src/graphql';
import { DocumentMetadata } from './DocumentMetadata';
import { DocumentTextWithMentions } from './DocumentTextWithMentions';
import { EntityMentionsList, type DocumentEntityRow } from './EntityMentionsList';
import { RelationshipEvidenceList } from './RelationshipEvidenceList';

type Mention = {
  __typename?: 'EntityMention';
  id: string;
  entityId: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
  entity: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
};

type Chunk = {
  __typename?: 'DocumentChunk';
  id: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  mentions: Mention[];
};

type DocumentSource = {
  __typename?: 'DocumentSource';
  id: string;
  documentId: string;
  kind: string;
  ingestedAt?: string | null;
  accessedAt?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  publisher?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  requestedUrl?: string | null;
  fetchedUrl?: string | null;
  contentSha256?: string | null;
  fileSha256?: string | null;
  lastModifiedMs?: string | null;
};

type Document = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
  sourceType?: string | null;
  sourceLabel?: string | null;
  source?: DocumentSource | null;
  chunks: Chunk[];
};

type EvidenceMentionLink = {
  __typename?: 'EntityRelationshipEvidenceMention';
  evidenceId: string;
  mentionId: string;
  mention: Mention;
};

type RelationshipEvidence = {
  __typename?: 'EntityRelationshipEvidence';
  id: string;
  kind: string;
  createdAt: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  quotedText?: string | null;
  chunk: {
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
    document: {
      __typename?: 'Document';
      id: string;
      title: string;
      createdAt: string;
      sourceType?: string | null;
      sourceLabel?: string | null;
    };
  };
  mentionLinks: EvidenceMentionLink[];
};

type Relationship = {
  __typename?: 'EntityRelationship';
  id: string;
  relation: string;
  from: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
  to: { __typename?: 'Entity'; id: string; name: string; type: string; mentionCount: number };
  evidence: RelationshipEvidence[];
};

type GetDocumentIntelligenceResult = {
  document: Document | null;
  entityRelationships: Relationship[];
};

function buildEntities(chunks: Chunk[]): DocumentEntityRow[] {
  const byId = new Map<string, DocumentEntityRow>();

  for (const c of chunks) {
    for (const m of c.mentions ?? []) {
      const prev = byId.get(m.entityId);
      const nextMentions = prev?.mentions ?? [];
      byId.set(m.entityId, {
        id: m.entityId,
        name: m.entity?.name ?? m.entityId,
        type: m.entity?.type ?? '',
        mentionCount: (prev?.mentionCount ?? 0) + 1,
        mentions: [
          ...nextMentions,
          {
            mentionId: m.id,
            chunkId: c.id,
            chunkIndex: c.chunkIndex,
            startOffset: m.startOffset ?? null,
            endOffset: m.endOffset ?? null,
            excerpt: m.excerpt ?? null,
          },
        ],
      });
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function filterRelationshipsToDocument(docId: string, relationships: Relationship[]) {
  return relationships
    .map((r) => {
      const evidence = (r.evidence ?? []).filter((ev) => ev.chunk?.documentId === docId);
      return { ...r, evidence };
    })
    .filter((r) => (r.evidence ?? []).length > 0);
}

export function DocumentDetailPanel(props: {
  documentId: string | null;
  initialChunkIndex?: number | null;
}) {
  const { documentId } = props;

  const { data, loading, error } = useQuery<GetDocumentIntelligenceResult>(GET_DOCUMENT_INTELLIGENCE_QUERY, {
    variables: { id: documentId ?? '' },
    skip: !documentId,
  });

  const doc = data?.document ?? null;
  const chunks = useMemo(() => (doc?.chunks ?? []).slice().sort((a, b) => a.chunkIndex - b.chunkIndex), [doc?.chunks]);
  const entities = useMemo(() => buildEntities(chunks), [chunks]);

  const relationshipsForDoc = useMemo(() => {
    if (!doc) return [];
    return filterRelationshipsToDocument(doc.id, data?.entityRelationships ?? []);
  }, [data?.entityRelationships, doc]);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  if (!documentId) {
    return <Alert severity="info">Select a document to inspect its provenance, mentions, and relationship evidence.</Alert>;
  }

  return (
    <Box>
      {loading ? (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      ) : null}

      {!loading && !error && !doc ? <Alert severity="info">Document not found.</Alert> : null}

      {doc ? (
        <Stack spacing={3}>
          <DocumentMetadata document={doc} />

          <Divider />

          <EntityMentionsList
            documentId={doc.id}
            entities={entities}
            selectedEntityId={selectedEntityId}
            onSelectEntityId={(id) => setSelectedEntityId(id)}
          />

          <Divider />

          <DocumentTextWithMentions
            chunks={chunks}
            activeEntityId={selectedEntityId}
            onEntityClick={(id) => setSelectedEntityId(id)}
          />

          <Divider />

          <RelationshipEvidenceList
            relationships={relationshipsForDoc}
            selectedRelationshipId={selectedRelationshipId}
            onSelectRelationshipId={(id) => setSelectedRelationshipId(id)}
          />
        </Stack>
      ) : null}
    </Box>
  );
}

