/**
 * useIngestDocuments
 *
 * Orchestrates ingestion via `ingestDocument` (Nest): creates Document + DocumentSource + chunks.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { INGEST_DOCUMENT_MUTATION, DOCUMENTS_BY_USER_QUERY } from '../graphql';

export type IngestionSource =
  | {
      kind: 'manual';
      provenanceType?: string;
      provenanceLabel?: string;
      provenanceConfirmed?: boolean;
    }
  | {
      kind: 'file';
      filename: string;
      mimeType: string;
      sizeBytes: number;
      lastModifiedMs: number;
      fileSha256?: string;
      provenanceType?: string;
      provenanceLabel?: string;
      provenanceConfirmed?: boolean;
    }
  | {
      kind: 'url';
      url: string;
      accessedAtIso: string;
      fetchedUrl?: string;
      contentType?: string | null;
      publisher?: string | null;
      publishedAtIso?: string | null;
      author?: string | null;
      provenanceType?: string;
      provenanceLabel?: string;
      provenanceConfirmed?: boolean;
    };

export type IngestInput = {
  title: string;
  source: IngestionSource;
  text: string;
};

type IngestDocumentData = {
  ingestDocument: {
    __typename?: 'Document';
    id: string;
    title: string;
    createdAt: string;
    sourceType?: string | null;
    sourceLabel?: string | null;
    chunks: Array<{ __typename?: string; id: string }>;
  };
};

type IngestDocumentVars = {
  input: {
    title: string;
    userId: string;
    content: string;
    source: Record<string, unknown>;
  };
};

export type IngestProgress =
  | { state: 'idle' }
  | { state: 'running'; step: string; current: number; total: number }
  | { state: 'done'; documentId: string; chunksCreated: number }
  | { state: 'error'; message: string };

/** Maps client ingestion metadata to GraphQL `CreateDocumentSourceInput`. */
function toGqlIngestSource(source: IngestionSource): Record<string, unknown> {
  if (source.kind === 'manual') {
    return { kind: 'MANUAL' };
  }
  if (source.kind === 'file') {
    return {
      kind: 'FILE',
      filename: source.filename,
      mimeType: source.mimeType,
      sizeBytes: source.sizeBytes,
      lastModifiedMs: String(source.lastModifiedMs),
      fileSha256: source.fileSha256,
    };
  }
  return {
    kind: 'URL',
    requestedUrl: source.url,
    fetchedUrl: source.fetchedUrl ?? undefined,
    contentType: source.contentType ?? undefined,
    publisher: source.publisher ?? undefined,
    author: source.author ?? undefined,
    publishedAt: source.publishedAtIso ?? undefined,
    accessedAt: source.accessedAtIso,
  };
}

export function splitIntoChunks(text: string, targetChars = 2200) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end =
      cursor + targetChars > normalized.length ? normalized.length : cursor + targetChars;
    const window = normalized.slice(cursor, end);
    const brPara = window.lastIndexOf('\n\n');
    const brLine = window.lastIndexOf('\n');
    const lastBreak = brPara >= brLine ? brPara : brLine;
    const cut = lastBreak > 200 ? cursor + lastBreak : end;
    chunks.push(normalized.slice(cursor, cut).trim());
    cursor = cut;
  }
  return chunks.filter(Boolean);
}

export function useIngestDocuments(userId: string | null) {
  const [progress, setProgress] = useState<IngestProgress>({ state: 'idle' });

  const [ingestDocumentMutation] = useMutation<IngestDocumentData, IngestDocumentVars>(INGEST_DOCUMENT_MUTATION);

  const canIngest = useMemo(() => Boolean(userId), [userId]);

  const ingestOne = useCallback(
    async (input: IngestInput) => {
      if (!userId) {
        setProgress({ state: 'error', message: 'Missing user id; cannot ingest.' });
        return null;
      }

      const title = input.title.trim();
      const rawText = input.text;
      if (!title) {
        setProgress({ state: 'error', message: 'Title is required.' });
        return null;
      }
      if (!rawText.trim()) {
        setProgress({ state: 'error', message: 'No text content to ingest.' });
        return null;
      }

      setProgress({ state: 'running', step: 'Ingesting…', current: 1, total: 1 });
      try {
        const docResult = await ingestDocumentMutation({
          variables: {
            input: {
              title,
              userId,
              content: rawText,
              source: toGqlIngestSource(input.source),
            },
          },
          refetchQueries: [{ query: DOCUMENTS_BY_USER_QUERY, variables: { userId } }],
          awaitRefetchQueries: true,
        });

        const ingested = docResult.data?.ingestDocument;
        if (!ingested?.id) {
          setProgress({ state: 'error', message: 'Failed to ingest document.' });
          return null;
        }

        const chunkLen = ingested.chunks?.length ?? 0;
        const chunksCreated = chunkLen >= 1 ? chunkLen : 1;
        setProgress({ state: 'done', documentId: ingested.id, chunksCreated });
        return { documentId: ingested.id, chunksCreated };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Ingestion failed.';
        setProgress({ state: 'error', message: msg });
        return null;
      }
    },
    [ingestDocumentMutation, userId],
  );

  const reset = useCallback(() => setProgress({ state: 'idle' }), []);

  return { canIngest, progress, ingestOne, reset };
}
