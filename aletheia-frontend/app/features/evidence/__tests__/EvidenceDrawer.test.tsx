import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../../../hooks/useTheme';
import { EvidenceDrawer } from '../components/EvidenceDrawer';

vi.mock('../hooks/useDocumentEvidence', () => {
  return {
    useDocumentEvidence: () => {
      const document = {
        __typename: 'Document',
        id: 'd1',
        title: 'Doc One',
        createdAt: '2026-01-01T00:00:00Z',
        sourceType: 'URL',
        sourceLabel: 'example.com',
        source: { __typename: 'DocumentSource', id: 's1', documentId: 'd1', kind: 'URL' },
        chunks: [
          {
            __typename: 'DocumentChunk',
            id: 'c1',
            chunkIndex: 0,
            content: 'hello world',
            documentId: 'd1',
            mentions: [
              {
                __typename: 'EntityMention',
                id: 'm1',
                entityId: 'e1',
                chunkId: 'c1',
                startOffset: 6,
                endOffset: 11,
                excerpt: 'world',
                entity: { __typename: 'Entity', id: 'e1', name: 'World', type: 'Thing', mentionCount: 1 },
              },
            ],
          },
        ],
      };

      return {
        document,
        entities: [
          {
            entity: { __typename: 'Entity', id: 'e1', name: 'World', type: 'Thing', mentionCount: 1 },
            mentions: [
              {
                mentionId: 'm1',
                chunkId: 'c1',
                chunkIndex: 0,
                startOffset: 6,
                endOffset: 11,
                excerpt: 'world',
              },
            ],
          },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
      };
    },
  };
});

vi.mock('../hooks/useEntityMentions', () => {
  return {
    useEntityMentions: () => ({
      entityId: 'e1',
      mentions: [],
      chunksById: {},
      rangesByChunkId: { c1: [{ mentionId: 'm1', start: 6, end: 11 }] },
    }),
  };
});

describe('EvidenceDrawer', () => {
  it('renders evidence list + scrolls to mention when mentionId is provided', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });

    render(
      <ThemeProvider>
        <EvidenceDrawer open onClose={() => {}} documentId="d1" mentionId="m1" />
      </ThemeProvider>
    );

    expect(screen.getAllByText('Doc One').length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: 'evidence-list' })).toBeInTheDocument();

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  });
});

