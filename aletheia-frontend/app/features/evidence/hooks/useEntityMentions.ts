'use client';

import { useMemo } from 'react';
import type { EvidenceChunk, EvidenceDocument, DocumentEntityMentionRow } from './useDocumentEvidence';

function fail(message: string): never {
  throw new Error(`[Truth Surface] ${message}`);
}

export type HighlightRange = { start: number; end: number; mentionId: string };

export function useEntityMentions(args: { document: EvidenceDocument | null; entityId: string | null }) {
  const { document, entityId } = args;

  return useMemo(() => {
    if (!document || !entityId) {
      return {
        entityId: entityId ?? null,
        mentions: [] as DocumentEntityMentionRow[],
        rangesByChunkId: {} as Record<string, HighlightRange[]>,
        chunksById: {} as Record<string, EvidenceChunk>,
      };
    }

    const chunksById: Record<string, EvidenceChunk> = {};
    for (const c of document.chunks ?? []) {
      chunksById[c.id] = c;
    }

    const mentions: DocumentEntityMentionRow[] = [];
    const rangesByChunkId: Record<string, HighlightRange[]> = {};

    for (const c of document.chunks ?? []) {
      for (const m of c.mentions ?? []) {
        if (m.entityId !== entityId) continue;
        if (typeof m.startOffset !== 'number' || typeof m.endOffset !== 'number') {
          fail(`EntityMention(${m.id}) is missing offsets (required for Truth Surface)`);
        }
        if (m.endOffset > c.content.length) {
          fail(
            `EntityMention(${m.id}) offsets out of bounds for chunk ${c.id} length=${c.content.length} (end=${m.endOffset})`
          );
        }

        mentions.push({
          mentionId: m.id,
          chunkId: c.id,
          chunkIndex: c.chunkIndex,
          startOffset: m.startOffset,
          endOffset: m.endOffset,
          excerpt: m.excerpt ?? null,
        });

        (rangesByChunkId[c.id] ??= []).push({ start: m.startOffset, end: m.endOffset, mentionId: m.id });
      }
    }

    if (mentions.length === 0) {
      fail(`Selected entity "${entityId}" has no explicit mentions in this document`);
    }

    for (const ranges of Object.values(rangesByChunkId)) {
      ranges.sort((a, b) => a.start - b.start || b.end - a.end);
    }

    mentions.sort((a, b) => a.chunkIndex - b.chunkIndex || a.startOffset - b.startOffset);

    return { entityId, mentions, rangesByChunkId, chunksById };
  }, [document, entityId]);
}

