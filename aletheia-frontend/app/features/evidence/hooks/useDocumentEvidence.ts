'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';

import { GET_DOCUMENT_EVIDENCE_VIEW_QUERY } from '../graphql';

export type EvidenceDocumentSource = {
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

export type EvidenceEntity = {
  __typename?: 'Entity';
  id: string;
  name: string;
  type: string;
  mentionCount: number;
};

export type EvidenceMention = {
  __typename?: 'EntityMention';
  id: string;
  entityId: string;
  chunkId: string;
  startOffset?: number | null;
  endOffset?: number | null;
  excerpt?: string | null;
  entity: EvidenceEntity;
};

export type EvidenceChunk = {
  __typename?: 'DocumentChunk';
  id: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  mentions: EvidenceMention[];
};

export type EvidenceDocument = {
  __typename?: 'Document';
  id: string;
  title: string;
  createdAt: string;
  sourceType?: string | null;
  sourceLabel?: string | null;
  source?: EvidenceDocumentSource | null;
  chunks: EvidenceChunk[];
};

export type DocumentEntityMentionRow = {
  mentionId: string;
  chunkId: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  excerpt: string | null;
};

export type DocumentEntityRow = {
  entity: EvidenceEntity;
  mentions: DocumentEntityMentionRow[];
};

type GetDocumentEvidenceViewData = {
  document: EvidenceDocument | null;
};

type GetDocumentEvidenceViewVars = {
  id: string;
};

function fail(message: string): never {
  throw new Error(`[Truth Surface] ${message}`);
}

function assertPresent<T>(value: T | null | undefined, label: string): NonNullable<T> {
  if (value === null || value === undefined) fail(`${label} is missing`);
  return value as NonNullable<T>;
}

function assertOffsets(start: number | null | undefined, end: number | null | undefined, label: string) {
  if (typeof start !== 'number' || typeof end !== 'number') {
    fail(`${label} requires numeric startOffset/endOffset (got ${String(start)}/${String(end)})`);
  }
  if (start < 0 || end <= start) fail(`${label} has invalid offsets (start=${start}, end=${end})`);
}

function assertOffsetsWithinContent(content: string, start: number, end: number, label: string) {
  if (end > content.length) {
    fail(`${label} offsets are out of bounds for chunk content length=${content.length} (end=${end})`);
  }
}

function assertDocumentProvenance(doc: EvidenceDocument) {
  assertPresent(doc.sourceType, 'Document.sourceType');
  assertPresent(doc.sourceLabel, 'Document.sourceLabel');
  assertPresent(doc.source, 'Document.source');
}

function assertChunkAndMentions(doc: EvidenceDocument) {
  if ((doc.chunks ?? []).length === 0) {
    fail('Document has no chunks; Truth Surface requires explicit chunk text');
  }

  let totalMentions = 0;
  for (const c of doc.chunks ?? []) {
    assertPresent(c.content, `DocumentChunk(${c.id}).content`);
    for (const m of c.mentions ?? []) {
      totalMentions += 1;
      assertPresent(m.entity, `EntityMention(${m.id}).entity`);
      if (m.entityId !== m.entity.id) {
        fail(`EntityMention(${m.id}).entityId does not match entity.id (${m.entityId} != ${m.entity.id})`);
      }
      if (m.chunkId !== c.id) {
        fail(`EntityMention(${m.id}).chunkId does not match parent chunk.id (${m.chunkId} != ${c.id})`);
      }
      assertOffsets(m.startOffset, m.endOffset, `EntityMention(${m.id})`);
      assertOffsetsWithinContent(c.content, m.startOffset as number, m.endOffset as number, `EntityMention(${m.id})`);
    }
  }

  if (totalMentions === 0) {
    fail('Document has no mentions; Truth Surface requires explicit mention evidence');
  }
}

function buildEntitiesFromChunks(chunks: EvidenceChunk[]): DocumentEntityRow[] {
  const byId = new Map<string, { entity: EvidenceEntity; mentions: DocumentEntityMentionRow[] }>();

  for (const c of chunks ?? []) {
    for (const m of c.mentions ?? []) {
      const start = m.startOffset as number;
      const end = m.endOffset as number;
      const row = byId.get(m.entityId);
      if (!row) {
        byId.set(m.entityId, {
          entity: m.entity,
          mentions: [
            {
              mentionId: m.id,
              chunkId: c.id,
              chunkIndex: c.chunkIndex,
              startOffset: start,
              endOffset: end,
              excerpt: m.excerpt ?? null,
            },
          ],
        });
      } else {
        row.mentions.push({
          mentionId: m.id,
          chunkId: c.id,
          chunkIndex: c.chunkIndex,
          startOffset: start,
          endOffset: end,
          excerpt: m.excerpt ?? null,
        });
      }
    }
  }

  return [...byId.values()]
    .map((v) => ({
      entity: v.entity,
      mentions: v.mentions.slice().sort((a, b) => a.chunkIndex - b.chunkIndex || a.startOffset - b.startOffset),
    }))
    .sort((a, b) => a.entity.name.localeCompare(b.entity.name));
}

export function useDocumentEvidence(documentId: string | null) {
  const vars = useMemo(() => ({ id: documentId ?? '' }), [documentId]);

  const query = useQuery<GetDocumentEvidenceViewData, GetDocumentEvidenceViewVars>(GET_DOCUMENT_EVIDENCE_VIEW_QUERY, {
    variables: vars,
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  const document = query.data?.document ?? null;

  const checked = useMemo(() => {
    if (!documentId) return { document: null as EvidenceDocument | null, entities: [] as DocumentEntityRow[] };

    // During loading (or while an error is present), do not throw. Let the caller render a loading/error state.
    if (query.loading || query.error) {
      return { document: null as EvidenceDocument | null, entities: [] as DocumentEntityRow[] };
    }

    const doc = assertPresent(document, `Document(${documentId})`);
    assertDocumentProvenance(doc);
    assertChunkAndMentions(doc);
    const entities = buildEntitiesFromChunks(doc.chunks ?? []);
    return { document: doc, entities };
  }, [document, documentId, query.error, query.loading]);

  return {
    document: checked.document,
    entities: checked.entities,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

