/**
 * useIngestDocuments
 *
 * Orchestrates ingestion: create Document -> create Chunks (sequential).
 * This is intentionally explicit and deterministic for auditability.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client/react';

import { CREATE_CHUNK_MUTATION, CREATE_DOCUMENT_MUTATION, DOCUMENTS_BY_USER_QUERY } from '../graphql';

export type IngestionSource =
  | {
      kind: 'manual';
      /**
       * Optional user-entered provenance classification.
       * This is not a trust signal; it is simply how the source was obtained.
       */
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
      // Optional digests for auditability (may be absent if not computed).
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
  // The extracted text snapshot to ingest (not a "file" artifact after this step).
  text: string;
};

type CreateDocumentData = {
  createDocument: { __typename?: 'Document'; id: string; title: string; createdAt: string };
};
type CreateDocumentVars = { title: string; userId: string };

type CreateChunkData = {
  createChunk: {
    __typename?: 'DocumentChunk';
    id: string;
    chunkIndex: number;
    content: string;
    documentId: string;
  };
};
type CreateChunkVars = { documentId: string; chunkIndex: number; content: string };

export type IngestProgress =
  | { state: 'idle' }
  | { state: 'running'; step: string; current: number; total: number }
  | { state: 'done'; documentId: string; chunksCreated: number }
  | { state: 'error'; message: string };

function safeYamlScalar(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Keep it simple: escape newlines and wrap in quotes if it contains ':'.
  const compact = s.replace(/\r?\n/g, '\\n');
  if (compact.includes(':') || compact.includes('#')) return JSON.stringify(compact);
  return compact;
}

function safeYamlBool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value ? 'true' : 'false';
}

async function sha256HexOfText(text: string): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const buf = new TextEncoder().encode(text);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(digest);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

function toProvenanceHeader(source: IngestionSource, opts: { ingestedAtIso: string; contentSha256?: string | null }) {
  const { ingestedAtIso, contentSha256 } = opts;
  if (source.kind === 'manual') {
    return `---\nsource:\n  kind: manual\n  provenanceType: ${safeYamlScalar(
      source.provenanceType
    )}\n  provenanceLabel: ${safeYamlScalar(source.provenanceLabel)}\n  provenanceConfirmed: ${safeYamlBool(
      source.provenanceConfirmed
    )}\ningestedAt: ${safeYamlScalar(ingestedAtIso)}\ncontentSha256: ${safeYamlScalar(contentSha256)}\n---\n`;
  }
  if (source.kind === 'file') {
    return `---\nsource:\n  kind: file\n  provenanceType: ${safeYamlScalar(
      source.provenanceType
    )}\n  provenanceLabel: ${safeYamlScalar(source.provenanceLabel)}\n  provenanceConfirmed: ${safeYamlBool(
      source.provenanceConfirmed
    )}\n  filename: ${safeYamlScalar(source.filename)}\n  mimeType: ${safeYamlScalar(
      source.mimeType
    )}\n  sizeBytes: ${safeYamlScalar(source.sizeBytes)}\n  lastModifiedMs: ${safeYamlScalar(
      source.lastModifiedMs
    )}\n  fileSha256: ${safeYamlScalar(source.fileSha256)}\ningestedAt: ${safeYamlScalar(
      ingestedAtIso
    )}\ncontentSha256: ${safeYamlScalar(contentSha256)}\n---\n`;
  }
  return `---\nsource:\n  kind: url\n  provenanceType: ${safeYamlScalar(
    source.provenanceType
  )}\n  provenanceLabel: ${safeYamlScalar(source.provenanceLabel)}\n  provenanceConfirmed: ${safeYamlBool(
    source.provenanceConfirmed
  )}\n  url: ${safeYamlScalar(source.url)}\n  fetchedUrl: ${safeYamlScalar(
    source.fetchedUrl
  )}\n  contentType: ${safeYamlScalar(source.contentType)}\n  publisher: ${safeYamlScalar(
    source.publisher
  )}\n  author: ${safeYamlScalar(source.author)}\n  publishedAt: ${safeYamlScalar(
    source.publishedAtIso
  )}\n  accessedAt: ${safeYamlScalar(source.accessedAtIso)}\ningestedAt: ${safeYamlScalar(
    ingestedAtIso
  )}\ncontentSha256: ${safeYamlScalar(contentSha256)}\n---\n`;
}

export function splitIntoChunks(text: string, targetChars = 2200) {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end = Math.min(cursor + targetChars, normalized.length);
    // Try to break at a paragraph boundary for readability.
    const window = normalized.slice(cursor, end);
    const lastBreak = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('\n'));
    const cut = lastBreak > 200 ? cursor + lastBreak : end; // avoid tiny chunks
    chunks.push(normalized.slice(cursor, cut).trim());
    cursor = cut;
  }
  return chunks.filter(Boolean);
}

export function useIngestDocuments(userId: string | null) {
  const [progress, setProgress] = useState<IngestProgress>({ state: 'idle' });

  const [createDocumentMutation] = useMutation<CreateDocumentData, CreateDocumentVars>(
    CREATE_DOCUMENT_MUTATION
  );
  const [createChunkMutation] = useMutation<CreateChunkData, CreateChunkVars>(CREATE_CHUNK_MUTATION);

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

      // Best-effort content digest (for audit, not security).
      setProgress({ state: 'running', step: 'Preparing provenance…', current: 0, total: 1 });
      const contentSha256 = await sha256HexOfText(rawText);

      setProgress({ state: 'running', step: 'Creating document…', current: 0, total: 1 });
      const docResult = await createDocumentMutation({
        variables: { title, userId },
        refetchQueries: [{ query: DOCUMENTS_BY_USER_QUERY, variables: { userId } }],
        awaitRefetchQueries: true,
      });

      const documentId = docResult.data?.createDocument?.id ?? null;
      if (!documentId) {
        setProgress({ state: 'error', message: 'Failed to create document.' });
        return null;
      }

      const header = toProvenanceHeader(input.source, { ingestedAtIso: new Date().toISOString(), contentSha256 });
      const chunkBodies = splitIntoChunks(rawText);
      const contents = [`${header}${chunkBodies[0] ?? ''}`, ...chunkBodies.slice(1)];

      setProgress({
        state: 'running',
        step: 'Indexing (chunking)…',
        current: 0,
        total: Math.max(contents.length, 1),
      });

      for (let i = 0; i < contents.length; i += 1) {
        setProgress({ state: 'running', step: 'Indexing (chunking)…', current: i + 1, total: contents.length });
        await createChunkMutation({
          variables: { documentId, chunkIndex: i, content: contents[i] ?? '' },
        });
      }

      setProgress({ state: 'done', documentId, chunksCreated: contents.length });
      return { documentId, chunksCreated: contents.length };
    },
    [createChunkMutation, createDocumentMutation, userId]
  );

  const reset = useCallback(() => setProgress({ state: 'idle' }), []);

  return { canIngest, progress, ingestOne, reset };
}

