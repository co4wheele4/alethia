import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EvidenceList } from '../components/EvidenceList';

describe('EvidenceList', () => {
  it('scrolls the active mention row into view', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });

    const doc = {
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
          mentions: [],
        },
      ],
    } as any;

    const entities = [
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
          {
            mentionId: 'm2',
            chunkId: 'c1',
            chunkIndex: 0,
            startOffset: 0,
            endOffset: 5,
            excerpt: 'hello',
          },
        ],
      },
    ] as any;

    const { rerender } = render(
      <EvidenceList document={doc} entities={entities} activeMentionId={null} onSelectMention={() => {}} />
    );

    expect(screen.getByRole('list', { name: 'evidence-list' })).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(<EvidenceList document={doc} entities={entities} activeMentionId="m1" onSelectMention={() => {}} />);
    expect(scrollIntoView).toHaveBeenCalled();
  });
});

