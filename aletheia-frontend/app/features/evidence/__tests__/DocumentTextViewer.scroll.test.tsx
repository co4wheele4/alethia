import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../../../hooks/useTheme';
import { DocumentTextViewer } from '../components/DocumentTextViewer';

describe('DocumentTextViewer (scroll-to-evidence)', () => {
  it('scrolls to the selected mention when scrollToMentionId is provided', async () => {
    const scrollIntoView = vi.fn();
    // jsdom: patch scrollIntoView for this test only
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });

    render(
      <ThemeProvider>
        <DocumentTextViewer
          document={{
            __typename: 'Document',
            id: 'd1',
            title: 'Doc',
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
          }}
          activeEntityId="e1"
          rangesByChunkId={{ c1: [{ mentionId: 'm1', start: 6, end: 11 }] }}
          scrollToMentionId="m1"
        />
      </ThemeProvider>
    );

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  });
});

